// server/prisma/import-menu-batch.ts
// Import a menu JSON into MANY restaurants in one run (test data, demos, or real menus).
// It is a thin wrapper around runImport() from import-wordpress-menu.ts, so the menu rules are
// identical: names unique per restaurant, variants -> required modifier groups, re-runs are safe.
//
//   npx ts-node prisma/import-menu-batch.ts --dry-run
//   npx ts-node prisma/import-menu-batch.ts
//
// Flags:
//   --manifest=<path>        Targets file. Default: prisma/data/menu-targets.json
//   --dry-run                Writes nothing, downloads nothing.
//   --only=<a,b,c>           Run only the targets whose slug or name matches (case-insensitive).
//   --skip-unresolved        Import the targets that resolve even if some do not (default: abort all).
//   --quiet                  One header line + one summary line per restaurant (no per-item lines).
//   --skip-images | --skip-banners | --keep-empty-categories | --mirror-dir=<dir> --public-base-url=<url>   (same as the importer)
//   --confirm-remote         REQUIRED for a real (non-dry) run when DATABASE_URL is not localhost.
//
// Manifest (prisma/data/menu-targets.json) - to add a restaurant, add one line:
//   {
//     "defaultMenuFile": "namaste-menu-extracted.json",      // relative to the manifest, or absolute
//     "restaurants": [
//       { "name": "Darbar Restaurants" },                    // matched by EXACT name (case-insensitive)
//       { "slug": "darbar-restaurants-1a2b3c4d" },           // or by slug
//       { "name": "Some Cafe", "menuFile": "cafe-menu.json" }, // per-restaurant menu
//       { "name": "Shanti", "menuFile": "shanti-menu.json", "keepEmptyCategories": true } // keep the site's empty categories
//     ]
//   }
//
// Safety:
//  - Every target is resolved BEFORE anything is written. A missing restaurant, a name that matches
//    more than one restaurant, a bad menu file or a duplicate target aborts the whole run
//    (unless --skip-unresolved).
//  - A real run against a non-local database needs --confirm-remote.
try { require('dotenv/config'); } catch { /* env already loaded */ }
import { readFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { runImport, MenuFile, Options } from './import-wordpress-menu';

export type Target = { slug?: string; name?: string; menuFile?: string; keepEmptyCategories?: boolean };
export type Manifest = { defaultMenuFile?: string; restaurants: Target[] };
export type BatchOptions = Omit<Options, 'restaurantSlug'> & {
  manifestDir: string;
  only?: string[];
  quiet: boolean;
  skipUnresolved: boolean;
};
type Logger = { log: (...a: any[]) => void; warn: (...a: any[]) => void; error: (...a: any[]) => void };
type Resolved = { target: Target; slug: string; name: string; menuPath: string };
type Problem = { label: string; reason: string };
export type BatchResult = { slug: string; name: string; stats?: any; error?: string };

const labelOf = (t: Target) => t.slug ?? t.name ?? '(empty target)';

function isValidMenu(d: any): d is MenuFile {
  return !!d && Array.isArray(d.categories) && Array.isArray(d.items) && Array.isArray(d.banners);
}

// Prints only the header and "Done" lines of runImport; warnings and errors always show.
function quietLogger(log: Logger): Logger {
  return {
    log: (...a: any[]) => {
      const s = String(a[0] ?? '');
      if (/^(\[DRY RUN\] )?->/.test(s) || /^\nDone/.test(s)) log.log(...a);
    },
    warn: (...a: any[]) => log.warn(...a),
    error: (...a: any[]) => log.error(...a),
  };
}

async function resolveTargets(prisma: any, manifest: Manifest, o: BatchOptions) {
  const resolved: Resolved[] = [];
  const problems: Problem[] = [];
  const menus = new Map<string, MenuFile>();
  const seenSlugs = new Set<string>();

  let targets = manifest.restaurants;
  if (o.only?.length) {
    const want = o.only.map((s) => s.trim().toLowerCase());
    targets = targets.filter((t) => want.includes((t.slug ?? '').toLowerCase()) || want.includes((t.name ?? '').toLowerCase()));
  }

  for (const t of targets) {
    const label = labelOf(t);
    if (!t.slug && !t.name) { problems.push({ label, reason: 'needs "slug" or "name"' }); continue; }

    const menuRel = t.menuFile ?? manifest.defaultMenuFile;
    if (!menuRel) { problems.push({ label, reason: 'no "menuFile" and no "defaultMenuFile" in the manifest' }); continue; }
    const menuPath = resolve(o.manifestDir, menuRel);
    if (!menus.has(menuPath)) {
      try {
        const data = JSON.parse(await readFile(menuPath, 'utf8'));
        if (!isValidMenu(data)) throw new Error('missing categories/items/banners arrays');
        menus.set(menuPath, data);
      } catch (e) {
        problems.push({ label, reason: `menu file ${menuPath}: ${(e as Error).message}` });
        continue;
      }
    }

    let found: { slug: string; name: string } | null = null;
    if (t.slug) {
      found = await prisma.restaurant.findUnique({ where: { slug: t.slug }, select: { slug: true, name: true } });
      if (!found) { problems.push({ label, reason: `no restaurant with slug "${t.slug}"` }); continue; }
    } else {
      const matches: { slug: string; name: string }[] = await prisma.restaurant.findMany({
        where: { name: { equals: t.name, mode: 'insensitive' } },
        select: { slug: true, name: true },
      });
      if (matches.length === 0) { problems.push({ label, reason: 'no restaurant with this name - create it in the app first' }); continue; }
      if (matches.length > 1) {
        problems.push({ label, reason: `${matches.length} restaurants share this name (${matches.map((m) => m.slug).join(', ')}) - use "slug" instead` });
        continue;
      }
      found = matches[0];
    }

    if (seenSlugs.has(found.slug)) { problems.push({ label, reason: `duplicate target: ${found.slug} is listed twice` }); continue; }
    seenSlugs.add(found.slug);
    resolved.push({ target: t, slug: found.slug, name: found.name, menuPath });
  }
  return { resolved, problems, menus };
}

export async function runBatch(prisma: any, manifest: Manifest, o: BatchOptions, log: Logger = console): Promise<BatchResult[]> {
  if (!manifest || !Array.isArray(manifest.restaurants) || manifest.restaurants.length === 0) {
    throw new Error('Manifest has no "restaurants" entries.');
  }
  const { resolved, problems, menus } = await resolveTargets(prisma, manifest, o);

  if (problems.length) {
    log.error(`\n${problems.length} target(s) could not be resolved:`);
    for (const p of problems) log.error(`  ✗ ${p.label}: ${p.reason}`);
    if (!o.skipUnresolved) {
      throw new Error('Nothing was imported. Fix the manifest (or the restaurants), or pass --skip-unresolved.');
    }
    log.warn('\n--skip-unresolved: continuing with the targets that resolved.');
  }
  if (resolved.length === 0) throw new Error('No targets to import.');

  log.log(`\n${o.dryRun ? '[DRY RUN] ' : ''}Importing into ${resolved.length} restaurant(s):`);
  resolved.forEach((r, i) => log.log(`  ${i + 1}. ${r.name} (${r.slug})`));

  const { manifestDir: _m, only: _o, quiet, skipUnresolved: _s, ...importOpts } = o;
  const results: BatchResult[] = [];
  for (const r of resolved) {
    log.log(`\n=== ${r.name} ===`);
    try {
      const stats = await runImport(
        prisma, menus.get(r.menuPath)!,
        { ...importOpts, keepEmptyCategories: r.target.keepEmptyCategories ?? importOpts.keepEmptyCategories, restaurantSlug: r.slug },
        quiet ? quietLogger(log) : log,
      );
      results.push({ slug: r.slug, name: r.name, stats });
    } catch (e) {
      const msg = (e as Error).message;
      log.error(`✗ ${r.name}: ${msg}`);
      results.push({ slug: r.slug, name: r.name, error: msg });
    }
  }

  log.log(`\n===== Summary${o.dryRun ? ' (dry run)' : ''} =====`);
  const width = Math.max(...results.map((r) => r.name.length));
  for (const r of results) {
    if (r.error) { log.log(`${r.name.padEnd(width)}  FAILED: ${r.error}`); continue; }
    const s = r.stats;
    log.log(
      `${r.name.padEnd(width)}  categories +${s.catCreated}/${s.catExisting} existing | items +${s.itemCreated}, skipped ${s.itemSkipped}, ` +
      `failed ${s.itemFailed} | groups ${s.groups} (${s.options} options) | banners +${s.bannerCreated}`,
    );
  }
  const bad = results.filter((r) => r.error || r.stats?.itemFailed > 0).length;
  log.log(bad ? `\n${bad} restaurant(s) had failures - see the ✗ lines above.` : `\nAll ${results.length} restaurant(s) OK.`);
  return results;
}

// ---------- CLI ----------
function describeDb(): { text: string; local: boolean } {
  const raw = process.env.DATABASE_URL;
  if (!raw) return { text: '(DATABASE_URL not set)', local: false };
  try {
    const u = new URL(raw);
    const local = ['localhost', '127.0.0.1', '::1', '[::1]', 'host.docker.internal'].includes(u.hostname);
    return { text: `${u.hostname}${u.port ? ':' + u.port : ''}${u.pathname}`, local };
  } catch {
    return { text: '(unparseable DATABASE_URL)', local: false };
  }
}

if (require.main === module) {
  const { PrismaClient } = require('@prisma/client');
  const arg = (n: string) => process.argv.find((a: string) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=');
  const flag = (n: string) => process.argv.includes(`--${n}`);
  const prisma = new PrismaClient();

  (async () => {
    const manifestPath = resolve(arg('manifest') ?? join(__dirname, 'data', 'menu-targets.json'));
    const manifest: Manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const mirrorDir = arg('mirror-dir');
    const publicBaseUrl = arg('public-base-url');
    if (!!mirrorDir !== !!publicBaseUrl) throw new Error('--mirror-dir and --public-base-url must be used together');

    const db = describeDb();
    console.log(`Database: ${db.text}`);
    if (!flag('dry-run') && !db.local && !flag('confirm-remote')) {
      throw new Error(`Refusing to write to a non-local database (${db.text}). Re-run with --confirm-remote if that is intended.`);
    }

    const results = await runBatch(prisma, manifest, {
      manifestDir: dirname(manifestPath),
      only: arg('only')?.split(','),
      quiet: flag('quiet'),
      skipUnresolved: flag('skip-unresolved'),
      dryRun: flag('dry-run'),
      skipImages: flag('skip-images'),
      skipBanners: flag('skip-banners'),
      keepEmptyCategories: flag('keep-empty-categories'),
      mirrorDir,
      publicBaseUrl,
    });
    if (results.some((r) => r.error || r.stats?.itemFailed > 0)) process.exitCode = 1;
  })()
    .catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
