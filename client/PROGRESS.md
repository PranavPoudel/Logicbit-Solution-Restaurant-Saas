# LogicBit Frontend — Progress Tracker

Last updated: Step "5-in-1 batch" (Modifier modal, Account page, Coupons, Settlements, Dashboard real data)

Status legend: ✅ Done &nbsp;|&nbsp; ⚠️ Partial &nbsp;|&nbsp; ❌ Not started

---

## Portal 1 — Customer App

| Module | Status | के छ | के बाँकी |
|---|---|---|---|
| 2. Customer Auth | ✅ | Login, Signup, Guest checkout | — |
| 9. Discovery (Homepage) | ✅ | Hero, cuisine categories, filter chips, real nearby-restaurants data | Cuisine chips still hardcoded, not from `/discovery/cuisines` |
| 7. Menu (customer view) | ✅ | Restaurant page, category nav, item list, **modifier modal** | Featured items / featured categories sections not built |
| 10. Order (customer) | ✅ | Cart, Checkout (address/order-type/COD), Order tracking | Delivery fee hardcoded (not distance-tiered yet) |
| 11. Coupon (customer) | ✅ | Coupon input at checkout | Response shape unconfirmed — needs live test |
| 18. Customer Self-Service | ✅ | Account page — Profile, Addresses, Order history, Favorites | — |
| 12. Review (customer) | ❌ | — | "Rate your order" prompt after delivery, star input |
| 14. Storefront (customer view) | ❌ | — | Per-restaurant banner/about/contact display |

## Portal 2 — Owner Dashboard

| Module | Status | के छ | के बाँकी |
|---|---|---|---|
| 1. Owner Auth | ⚠️ | Login (+ auto-fetch restaurants) | Register form, Staff management page |
| 6. Restaurant Settings | ✅ | General/Location/Delivery/Branding/Service tabs | Map picker (needs Mapbox/Google key) |
| 7. Menu (owner) | ✅ | Category + MenuItem CRUD, **ModifierGroup builder** (create groups, add/remove options, link/unlink to items) | — |
| 10. Order (owner) | ✅ | Orders page — tabs, Accept/Reject, status progression | — |
| 11. Coupon (owner) | ✅ | Coupon list + create | Edit, expiry date field |
| 16. Settlement (owner) | ✅ | Outstanding + history | — |
| 17. Subscription (owner) | ⚠️ | Dashboard banner wired to real data | Auto-renew toggle not wired |
| 5. Roles & Permissions | ❌ | — | Role builder, permission checklist |
| 14. Storefront Builder | ❌ | — | Banner manager (drag-drop), section order, popup scheduler |
| 15. Advertisement (owner) | ❌ | — | "Advertise your restaurant" request form |
| 19. Media | ❌ | — | Reusable image-upload component (needed by Menu, Restaurant, Banners) |
| 8. Cuisine (owner) | ❌ | — | Multi-select checklist on Settings |

## Portal 3 — Delivery App
**Nothing built yet.** Auth + API layer exist (`lib/api/delivery.ts`, `lib/api/delivery-auth.ts`); no pages. Needs: register/login, availability toggle, available-orders list, active-delivery view, earnings.

## Portal 4 — Platform Admin
**Nothing built yet.** Auth + full API layer exist (`lib/api/platform-admin.ts`, `lib/api/platform-auth.ts`); no pages. Needs: login, revenue dashboard, restaurant management, staff/roles, activity log, refunds.

---

## Suggested order for what's left

1. ~~Owner: **ModifierGroup builder**~~ ✅ done
2. Owner: **Media/image upload** (small reusable piece, unblocks real photos everywhere)
3. Customer: **Review** (small, closes the order loop)
4. Owner: **Storefront Builder** (bigger — drag-drop)
5. Owner: **Advertisement + Roles & Permissions**
6. **Delivery App** (own portal)
7. **Platform Admin** (own portal)

---

## Workflow reminder
- New file / small change → path + full content pasted in chat, **no zip, no npm install** unless a new package was added.
- Zip only when explicitly asked or after a big batch.
