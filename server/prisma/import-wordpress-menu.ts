// server/prisma/import-wordpress-menu.ts
// One-off import of a WooCommerce menu (extracted to JSON) into ONE restaurant.
//
//   npx ts-node prisma/import-wordpress-menu.ts --restaurant=namaste-dining --dry-run
//   npx ts-node prisma/import-wordpress-menu.ts --restaurant=namaste-dining
//
// Flags:
//   --restaurant=<slug>      REQUIRED. Restaurant.slug of the restaurant that receives the menu.
//                            (tenantId is taken from that restaurant.)
//   --dry-run                Print what would happen; writes nothing, downloads nothing.
//   --file=<path>            JSON to read. Default: prisma/data/namaste-menu-extracted.json
//   --skip-images            Leave every image field empty.
//   --skip-banners           Don't import the hero banners.
//   --keep-empty-categories  Also create categories that hold no items (mirror the source site's category
//                            list exactly). Default: empty categories are skipped.
//   --mirror-dir=<dir>       Download images into <dir> instead of linking to the WordPress site...
//   --public-base-url=<url>  ...and store <url>/<filename> in the database. Both flags are needed
//                            together; you then host <dir> yourself (S3, /public, a CDN...).
//                            Without them the ORIGINAL WordPress image URL is stored, so that site
//                            must stay online.
//
// What it creates (all scoped to the restaurant's tenant):
//   Category            WordPress product_cat, parents first (max 2 levels, like CategoryService).
//                       Only categories that hold items (or parent one that does) are created.
//   MenuItem            One per published product, placed in its "primaryCategory".
//   ModifierGroup       Variable products (sizes, flavours, ...) become ONE required, pick-one group
//                       per item, linked to that item. Item price = cheapest variant; each option's
//                       extraPrice = variant price minus that base.
//   StorefrontBanner    Published hero sliders (anything flagged as test data is skipped).
//
// Rules copied from the menu services: category / menu-item / modifier-group names are unique per
// restaurant. Colliding names are made unique deterministically (e.g. "Mango Lassi (Takeout)").
//
// Safe to re-run: anything whose final name already exists in the restaurant is skipped, and each
// menu item + its modifier group is created in one transaction.
try { require('dotenv/config'); } catch { /* env already loaded (e.g. by prisma) */ }
import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// ---------- data shapes (see extract-woocommerce-menu.py) ----------
type WpCategory = { slug: string; name: string; parentSlug: string | null; flags: { duplicateName: boolean } };
type WpVariant = { label: string; price: number | null; priceDelta: number | null };
type WpItem = {
  wpId: string;
  wpStatus: string;
  dto: {
    name: string;
    description: string | null;
    price: number | null;
    image: string | null;
    primaryCategory: string | null;
    isAvailable: boolean;
  };
  variantGroup: { name: string | null; options: WpVariant[] } | null;
};
type WpBanner = {
  title: string;
  dto: { image: string | null; titleLine1: string | null; titleLine2: string | null; buttonUrl: string | null; isActive: boolean };
  flags: { looksLikeTestData: boolean };
};
export type MenuFile = { categories: WpCategory[]; items: WpItem[]; banners: WpBanner[] };

export type Options = {
  restaurantSlug: string;
  dryRun: boolean;
  skipImages: boolean;
  skipBanners: boolean;
  keepEmptyCategories?: boolean;
  mirrorDir?: string;
  publicBaseUrl?: string;
};

type Logger = { log: (...a: any[]) => void; warn: (...a: any[]) => void; error: (...a: any[]) => void };

// DTO limits from the create-* DTOs.
const LIMITS = { category: 100, item: 150, description: 1000, group: 100, option: 100 };
const clip = (s: string, max: number, what: string, log: Logger) => {
  if (s.length <= max) return s;
  log.warn(`    (${what} longer than ${max} chars, truncated)`);
  return s.slice(0, max);
};

// ---------- naming ----------
function buildNaming(data: MenuFile) {
  const catBySlug = new Map(data.categories.map((c) => [c.slug, c]));
  const top = (slug: string): WpCategory => {
    let c = catBySlug.get(slug)!;
    while (c.parentSlug && catBySlug.has(c.parentSlug)) c = catBySlug.get(c.parentSlug)!;
    return c;
  };
  // A child whose name is also used elsewhere is prefixed with its parent: "Takeout Drinks".
  const categoryName = (c: WpCategory) => {
    const parent = c.parentSlug ? catBySlug.get(c.parentSlug) : undefined;
    return c.flags.duplicateName && parent ? `${parent.name} ${c.name}` : c.name;
  };

  // Item names must be unique: top-level-category items keep their name, the rest get "(Top Category)".
  const itemName = new Map<string, string>(); // wpId -> final name
  const groups = new Map<string, WpItem[]>();
  for (const it of data.items) {
    const k = it.dto.name.trim().toLowerCase();
    groups.set(k, [...(groups.get(k) ?? []), it]);
  }
  for (const group of groups.values()) {
    const catOf = (it: WpItem) => catBySlug.get(it.dto.primaryCategory ?? '');
    const sorted = [...group].sort((a, b) => Number(!!catOf(a)?.parentSlug) - Number(!!catOf(b)?.parentSlug));
    const used = new Set<string>();
    sorted.forEach((it, idx) => {
      let name = it.dto.name.trim();
      if (idx > 0) {
        const c = catOf(it);
        const keeperTop = sorted[0].dto.primaryCategory ? top(sorted[0].dto.primaryCategory).name : '';
        const suffix = c ? (top(c.slug).name !== keeperTop ? top(c.slug).name : c.name) : `WP ${it.wpId}`;
        name = `${name} (${suffix})`;
      }
      let unique = name, n = 2;
      while (used.has(unique.toLowerCase())) unique = `${name} #${n++}`;
      used.add(unique.toLowerCase());
      itemName.set(it.wpId, unique);
    });
  }
  return { catBySlug, categoryName, itemName };
}

// ---------- images ----------
function detectExt(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => buf[i] === b)) return 'png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

function makeImageResolver(o: Options, log: Logger) {
  const cache = new Map<string, string | null>();
  return async function resolve(url?: string | null): Promise<string | null> {
    if (!url || o.skipImages) return null;
    if (!o.mirrorDir || !o.publicBaseUrl || o.dryRun) return url; // link mode: keep the WordPress URL
    if (cache.has(url)) return cache.get(url)!;
    let result: string | null = null;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = detectExt(buf);
      if (!ext) throw new Error('not a JPG/PNG/WebP');
      // Deterministic name -> re-runs reuse the same file instead of piling up copies.
      const name = `${createHash('sha1').update(url).digest('hex').slice(0, 16)}.${ext}`;
      await mkdir(o.mirrorDir, { recursive: true });
      if (!existsSync(join(o.mirrorDir, name))) await writeFile(join(o.mirrorDir, name), new Uint8Array(buf));
      result = `${o.publicBaseUrl.replace(/\/$/, '')}/${name}`;
    } catch (e) {
      log.warn(`    image failed, keeping original URL: ${url} -> ${(e as Error).message}`);
      result = url;
    }
    cache.set(url, result);
    return result;
  };
}

// ---------- the import ----------
export async function runImport(prisma: any, data: MenuFile, o: Options, log: Logger = console) {
  const restaurant = await prisma.restaurant.findUnique({ where: { slug: o.restaurantSlug } });
  if (!restaurant) throw new Error(`No restaurant with slug "${o.restaurantSlug}"`);
  const tenantId: string = restaurant.tenantId;
  const restaurantId: string = restaurant.id;
  const mode = o.mirrorDir ? 'mirror images' : o.skipImages ? 'no images' : 'link images';
  log.log(`${o.dryRun ? '[DRY RUN] ' : ''}-> "${restaurant.name}" (${o.restaurantSlug}), ${mode}`);

  const { catBySlug, categoryName, itemName } = buildNaming(data);
  const resolveImage = makeImageResolver(o, log);
  const stats = { catCreated: 0, catExisting: 0, itemCreated: 0, itemSkipped: 0, itemFailed: 0, groups: 0, options: 0, bannerCreated: 0, bannerSkipped: 0 };

  // 1) Categories: only the ones that hold items, plus their parents. Parents first.
  const items = data.items.filter((i) => i.wpStatus === 'publish');
  const needed = new Set<string>();
  for (const it of items) {
    const slug = it.dto.primaryCategory;
    if (!slug || !catBySlug.has(slug)) continue;
    needed.add(slug);
    const parent = catBySlug.get(slug)!.parentSlug;
    if (parent) needed.add(parent);
  }
  if (o.keepEmptyCategories) for (const c of data.categories) needed.add(c.slug); // mirror the source site, empty ones included
  const ordered = data.categories.filter((c) => needed.has(c.slug)).sort((a, b) => Number(!!a.parentSlug) - Number(!!b.parentSlug));
  const categoryId = new Map<string, string>();
  let catOrder = 0;
  for (const c of ordered) {
    const name = clip(categoryName(c), LIMITS.category, `category "${c.name}"`, log);
    const existing = await prisma.category.findFirst({ where: { tenantId, restaurantId, name, deletedAt: null } });
    if (existing) {
      categoryId.set(c.slug, existing.id);
      stats.catExisting++;
      log.log(`- category exists: ${name}`);
    } else if (o.dryRun) {
      categoryId.set(c.slug, `(new:${c.slug})`);
      stats.catCreated++;
      log.log(`✓ would create category: ${name}${c.parentSlug ? `  (under ${catBySlug.get(c.parentSlug)!.name})` : ''}`);
    } else {
      const created = await prisma.category.create({
        data: {
          tenantId, restaurantId, name, displayOrder: catOrder,
          parentId: c.parentSlug ? categoryId.get(c.parentSlug) ?? null : null,
          isActive: true,
        },
      });
      categoryId.set(c.slug, created.id);
      stats.catCreated++;
      log.log(`✓ created category: ${name}`);
    }
    catOrder++;
  }

  // 2) Menu items (+ variants as one modifier group each)
  const perCategoryOrder = new Map<string, number>();
  for (const it of items) {
    const d = it.dto;
    const name = clip(itemName.get(it.wpId) ?? d.name, LIMITS.item, `item "${d.name}"`, log);
    try {
      const catId = d.primaryCategory ? categoryId.get(d.primaryCategory) : undefined;
      if (!catId) throw new Error(`category "${d.primaryCategory}" was not imported`);
      if (d.price == null) throw new Error('no price');
      if (name !== d.name.trim()) log.log(`~ renamed (name must be unique): "${d.name}" -> "${name}"`);

      const displayOrder = perCategoryOrder.get(catId) ?? 0;
      perCategoryOrder.set(catId, displayOrder + 1);

      const dup = await prisma.menuItem.findFirst({ where: { tenantId, restaurantId, name, deletedAt: null } });
      if (dup) { log.log(`- skip (exists): ${name}`); stats.itemSkipped++; continue; }

      const vg = it.variantGroup;
      const groupName = vg ? clip(`${name} - ${vg.name ?? 'Option'}`, LIMITS.group, `group for "${name}"`, log) : null;
      if (o.dryRun) {
        const extra = vg ? `  + group "${groupName}" [${vg.options.map((v) => `${v.label} +${v.priceDelta ?? 0}`).join(', ')}]` : '';
        log.log(`✓ would create: ${name}  ¥${d.price}  [${d.primaryCategory}]${extra}`);
        stats.itemCreated++;
        if (vg) { stats.groups++; stats.options += vg.options.length; }
        continue;
      }

      const image = await resolveImage(d.image);
      const description = d.description ? clip(d.description, LIMITS.description, `description of "${name}"`, log) : null;

      await prisma.$transaction(async (tx: any) => {
        const item = await tx.menuItem.create({
          data: { tenantId, restaurantId, categoryId: catId, name, description, price: d.price, image, isAvailable: d.isAvailable, displayOrder },
        });
        if (vg && groupName) {
          const group = await tx.modifierGroup.create({
            data: {
              tenantId, restaurantId, name: groupName,
              minSelect: 1, maxSelect: 1, isRequired: true, displayOrder: 0,
              options: {
                create: vg.options.map((v, i) => ({
                  tenantId, name: clip(v.label, LIMITS.option, `option "${v.label}"`, log),
                  extraPrice: v.priceDelta ?? 0, isAvailable: true, displayOrder: i,
                })),
              },
            },
          });
          await tx.menuItemModifierGroup.create({ data: { menuItemId: item.id, modifierGroupId: group.id } });
        }
      });
      stats.itemCreated++;
      if (vg) { stats.groups++; stats.options += vg.options.length; }
      log.log(`✓ created: ${name}${vg ? `  (+ ${vg.options.length} options)` : ''}`);
    } catch (e) {
      stats.itemFailed++;
      log.error(`✗ ${name}: ${(e as Error).message}`);
    }
  }

  // 3) Banners
  if (!o.skipBanners) {
    let bannerOrder = 0;
    for (const b of data.banners) {
      const title = b.dto.titleLine1 ?? b.title;
      if (b.flags.looksLikeTestData || !b.dto.isActive || !b.dto.image) {
        log.log(`- skip banner (test data / inactive / no image): ${title}`);
        stats.bannerSkipped++;
        continue;
      }
      try {
        const dup = await prisma.storefrontBanner.findFirst({ where: { tenantId, restaurantId, title } });
        if (dup) { log.log(`- skip banner (exists): ${title}`); stats.bannerSkipped++; continue; }
        if (o.dryRun) { log.log(`✓ would create banner: ${title}`); stats.bannerCreated++; continue; }
        const imageUrl = await resolveImage(b.dto.image);
        if (!imageUrl) { stats.bannerSkipped++; continue; }
        await prisma.storefrontBanner.create({
          data: {
            tenantId, restaurantId, imageUrl, title,
            subtitle: b.dto.titleLine2,
            // WordPress links like "/shop/" are meaningless here; keep only absolute URLs.
            linkUrl: b.dto.buttonUrl && /^https?:\/\//.test(b.dto.buttonUrl) ? b.dto.buttonUrl : null,
            displayOrder: bannerOrder++, isActive: true,
          },
        });
        stats.bannerCreated++;
        log.log(`✓ created banner: ${title}`);
      } catch (e) {
        log.error(`✗ banner ${title}: ${(e as Error).message}`);
      }
    }
  }

  log.log(
    `\nDone${o.dryRun ? ' (dry run)' : ''}. categories: ${stats.catCreated} new, ${stats.catExisting} existing | ` +
    `items: ${stats.itemCreated} created, ${stats.itemSkipped} skipped, ${stats.itemFailed} failed | ` +
    `modifier groups: ${stats.groups} (${stats.options} options) | banners: ${stats.bannerCreated} created, ${stats.bannerSkipped} skipped`,
  );
  return stats;
}

// ---------- CLI ----------
if (require.main === module) {
  const { PrismaClient } = require('@prisma/client');
  const arg = (n: string) => process.argv.find((a: string) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=');
  const flag = (n: string) => process.argv.includes(`--${n}`);
  const prisma = new PrismaClient();

  (async () => {
    const restaurantSlug = arg('restaurant');
    if (!restaurantSlug) throw new Error('Missing --restaurant=<slug>');
    const mirrorDir = arg('mirror-dir');
    const publicBaseUrl = arg('public-base-url');
    if (!!mirrorDir !== !!publicBaseUrl) throw new Error('--mirror-dir and --public-base-url must be used together');
    const file = arg('file') ?? join(__dirname, 'data', 'namaste-menu-extracted.json');
    const data: MenuFile = JSON.parse(await readFile(file, 'utf8'));
    await runImport(prisma, data, {
      restaurantSlug, mirrorDir, publicBaseUrl,
      dryRun: flag('dry-run'), skipImages: flag('skip-images'), skipBanners: flag('skip-banners'),
      keepEmptyCategories: flag('keep-empty-categories'),
    });
  })()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
