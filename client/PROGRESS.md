# LogicBit Frontend — Progress Tracker

Last updated: After Analytics Module, Subscription Management, and Cuisine Checklist integration.

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
| 12. Review (customer) | ✅ | "Rate your order" modal integrated into order tracking | Owner reviews dashboard built |
| 14. Storefront (customer view) | ✅ | Banner carousel, About/Contact section, Auto-popup modal | — |

## Portal 2 — Owner Dashboard

| Module | Status | के छ | के बाँकी |
|---|---|---|---|
| 1. Owner Auth | ✅ | Login, **Register form with Map Picker**, Staff management (API ready) | — |
| 6. Restaurant Settings | ✅ | General/Location/Delivery/Branding/Service tabs, **Leaflet Map Picker integrated** | — |
| 7. Menu (owner) | ✅ | Category + MenuItem CRUD, **ModifierGroup builder** (create groups, add/remove options, link/unlink to items) | — |
| 10. Order (owner) | ✅ | Orders page — tabs, Accept/Reject, status progression | — |
| 11. Coupon (owner) | ✅ | Coupon list + create | Edit, expiry date field |
| 16. Settlement (owner) | ✅ | Outstanding + history | — |
| 17. Subscription (owner) | ✅ | Dashboard banner, **dedicated management page, auto-renew toggle wired** | — |
| 20. Analytics (owner) | ✅ | **Revenue stats, 7-day trend chart, top-selling items, real backend API** | — |
| 5. Roles & Permissions | ❌ | — | Role builder, permission checklist UI |
| 14. Storefront Builder | ✅ | **Banner manager, Config page, Popup scheduler**, sidebar sub-nav | — |
| 15. Advertisement (owner) | ❌ | — | "Advertise your restaurant" request form |
| 19. Media | ✅ | Reusable ImageUpload component, wired into Menu, Settings, Storefront | — |
| 8. Cuisine (owner) | ✅ | **Multi-select cuisine checklist integrated into Settings (General tab)** | — |

## Portal 3 — Delivery App
**Nothing built yet.** Auth + API layer exist (`lib/api/delivery.ts`, `lib/api/delivery-auth.ts`); no pages. Needs: register/login, availability toggle, available-orders list, active-delivery view, earnings.

## Portal 4 — Platform Admin
**Nothing built yet.** Auth + full API layer exist (`lib/api/platform-admin.ts`, `lib/api/platform-auth.ts`); no pages. Needs: login, revenue dashboard, restaurant management, staff/roles, activity log, refunds.

---

## Suggested order for what's left

1. ~~Owner: ModifierGroup builder~~ ✅ done
2. ~~Owner: Media/image upload~~ ✅ done
3. ~~Customer: Review~~ ✅ done
4. ~~Owner: Storefront Builder~~ ✅ done
5. ~~Owner: Cuisine checklist~~ ✅ done
6. ~~Owner: Subscription & Analytics~~ ✅ done
7. Owner: **Advertisement + Roles & Permissions** (Delegated)
8. **Delivery App** (own portal)
9. **Platform Admin** (own portal) (delegated)

---

## Workflow reminder
- New file / small change → path + full content pasted in chat, **no zip, no npm install** unless a new package was added.
- Zip only when explicitly asked or after a big batch.