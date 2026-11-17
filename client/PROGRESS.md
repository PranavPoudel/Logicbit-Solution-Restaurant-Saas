# LogicBit Frontend — Progress Tracker

Last updated: After Login Security + Google login, Stripe card payments, and the new home headline.

Status legend: ✅ Done  |  ⚠️ Partial  |  ❌ Not started

---

## Portal 1 — Customer App

| Module | Status | के छ | के बाँकी |
|---|---|---|---|
| 2. Customer Auth | ✅ | Login, Signup, Guest checkout, **Persistent Zustand Auth**, **Emailed confirm / reset codes, login lockout, sign out everywhere, Continue with Google** | Google login and emails not tested live yet (needs real keys / SMTP) |
| 9. Discovery (Homepage) | ✅ | Hero (**new two-line English / Japanese headline with sticker**), cuisine categories, **dynamic filter chips** from `/discovery/cuisines`, real nearby-restaurants data | — |
| 7. Menu (customer view) | ✅ | Restaurant page, category nav, item list, **modifier modal**, normalized `menuItems` -> `items` mapping | Featured items / featured categories sections not built |
| 10. Order (customer) | ✅ | Cart, Checkout (address/order-type/COD/**PayPay/Card**), Order tracking (**restaurant info card, "Waiting for your payment" with Pay now + Cancel**), **Payment return page with Try again**, **Dynamic distance-tiered delivery fee**, **Secure backend fee recalculation** | — |
| 11. Coupon (customer) | ✅ | Coupon input at checkout, **Live validation against `validateAndCalculate`**, accurate error handling | — |
| 18. Customer Self-Service | ✅ | Account page — Profile, Addresses, Order history, Favorites | — |
| 12. Review (customer) | ✅ | "Rate your order" modal integrated into order tracking | Owner reviews dashboard built |
| 14. Storefront (customer view) | ✅ | Banner carousel, About/Contact section, Auto-popup modal, **Fixed 401s by using `/discovery/` endpoints** | — |

## Portal 2 — Owner Dashboard

| Module | Status | के छ | के बाँकी |
|---|---|---|---|
| 1. Owner Auth | ✅ | Login, **Register form with Map Picker**, Staff management (API ready), **Multi-restaurant creation & switching** | — |
| 6. Restaurant Settings | ✅ | General/Location/Delivery/Branding/Service tabs, **Payments tab: Stripe key (saved, never shown again, remove key), owner-only**, **Leaflet Map Picker integrated**, **Zustand/React Query sync fixed** | — |
| 7. Menu (owner) | ✅ | Category + MenuItem CRUD, **ModifierGroup builder** (create groups, add/remove options, link/unlink to items) | — |
| 10. Order (owner) | ✅ | Orders page — tabs, Accept/Reject, status progression, **Card refunds (PayPay + Card) from order detail**, unpaid card orders hidden until paid | — |
| 11. Coupon (owner) | ✅ | **Full CRUD with Edit modal, expiry dates, usage limits, max discount caps** | — |
| 16. Settlement (owner) | ✅ | Outstanding + history, **outstanding commission fix** | — |
| 17. Subscription (owner) | ✅ | Dashboard banner, **dedicated management page, auto-renew toggle wired with optimistic UI & error reversion** | — |
| 20. Analytics (owner) | ✅ | Revenue stats, 7-day trend chart, top-selling items, **real backend API** | — |
| 5. Roles & Permissions | ✅  | — | Role builder, permission checklist UI |
| 14. Storefront Builder | ✅ | Banner manager, Config page, Popup scheduler, sidebar sub-nav | — |
| 15. Advertisement (owner) | ✅  | — | "Advertise your restaurant" request form |
| 19. Media | ✅ | Reusable ImageUpload component, wired into Menu, Settings, Storefront | — |
| 21. Card payments (Stripe) | ✅ | Stripe Checkout per restaurant, paid only after Stripe confirms, auto-cancel unpaid after 35 min, payment keys encrypted | Webhook and non-JPY currencies not tested against real Stripe; staff / coupon edge cases from review still open |
| 8. Cuisine (owner) | ✅ | **Multi-select cuisine checklist** integrated into Settings (General tab) | — |

## Portal 3 — Delivery App

**already buit** Auth + API layer exist (`lib/api/delivery.ts`, `lib/api/delivery-auth.ts`); no pages. Needs: register/login, availability toggle, available-orders list, active-delivery view, earnings.

## Portal 4 — Platform Admin

**already buit** Auth + full API layer exist (`lib/api/platform-admin.ts`, `lib/api/platform-auth.ts`); no pages. Needs: login, revenue dashboard, restaurant management, staff/roles, activity log, refunds.

---

## Suggested order for what's left

1. ~~Owner: ModifierGroup builder~~ ✅ done
2. ~~Owner: Media/image upload~~ ✅ done
3. ~~Customer: Review~~ ✅ done
4. ~~Owner: Storefront Builder~~ ✅ done
5. ~~Owner: Cuisine checklist~~ ✅ done
6. ~~Owner: Subscription & Analytics~~ ✅ done
7. ~~Customer: Coupon & Distance-tiered Delivery~~ ✅ done
8. **Owner: Advertisement + Roles & Permissions** (Delegated to interns) -- done
9. **Delivery App** (own portal) --done 
10. **Platform Admin** (own portal) (delegated to intern) -- done

---

## Workflow reminder

- New file / small change → path + full content pasted in chat, **no zip, no npm install** unless a new package was added.
- Zip only when explicitly asked or after a big batch.