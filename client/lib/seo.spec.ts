import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isPrivatePath, jsonLdString, localeAlternates, restaurantJsonLd, SITE_URL } from "./seo.ts";

describe("isPrivatePath", () => {
  it("hides the owner, admin and delivery apps and the api", () => {
    for (const path of ["/owner", "/owner/orders", "/admin/users", "/delivery/register", "/api/v1/x"]) assert.equal(isPrivatePath(path), true, path);
  });

  it("hides customer pages that belong to one person, with or without the language prefix", () => {
    for (const path of ["/en/cart", "/ja/checkout", "/en/orders/123", "/en/account", "/ja/login", "/en/payment/success", "/en/search", "/cart"]) assert.equal(isPrivatePath(path), true, path);
  });

  it("leaves the pages we want found", () => {
    for (const path of ["/", "/en", "/ja/restaurants", "/en/restaurants/momo-house", "/en/explore", "/en/for-restaurants", "/ja/privacy", "/administrators"]) assert.equal(isPrivatePath(path), false, path);
  });
});

describe("localeAlternates", () => {
  it("names the page itself and each language version", () => {
    const a = localeAlternates("ja", "/restaurants/momo");
    assert.equal(a.canonical, `${SITE_URL}/ja/restaurants/momo`);
    assert.deepEqual(Object.keys(a.languages), ["en", "ja", "x-default"]);
    assert.equal(a.languages["x-default"], `${SITE_URL}/en/restaurants/momo`);
  });
});

describe("restaurantJsonLd", () => {
  it("describes the restaurant and leaves out what we do not know", () => {
    const ld = restaurantJsonLd({ name: "Momo House", city: "Tokyo", cuisines: [{ name: "Nepali" }], avgRating: 4.5, totalReviews: 0 }, "https://x.test/en/restaurants/momo");
    assert.equal(ld["@type"], "Restaurant");
    assert.deepEqual(ld.servesCuisine, ["Nepali"]);
    assert.equal(ld.address?.addressLocality, "Tokyo");
    assert.equal(ld.aggregateRating, undefined, "no rating without reviews");
    assert.equal(ld.geo, undefined);
    assert.equal(restaurantJsonLd({ name: "A", avgRating: 4.5, totalReviews: 3 }, "u").aggregateRating?.reviewCount, 3);
  });

  it("cannot be used to close the script tag", () => {
    assert.ok(!jsonLdString({ name: "</script><b>" }).includes("<"));
  });
});
