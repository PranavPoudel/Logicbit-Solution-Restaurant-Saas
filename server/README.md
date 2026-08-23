# LogicBit Restaurant SaaS — Backend (Phase 1 Complete)

Multi-tenant Restaurant SaaS backend — NestJS + Prisma + PostgreSQL.

## ⚠️ पहिला चलाउनु अघि (Setup)

```bash
npm install
cp .env.example .env
# .env खोलेर DATABASE_URL, JWT secrets, र अरू भर्नुहोस्

npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed          # पहिलो Platform Admin बनाउने (PLATFORM_ADMIN_EMAIL/PASSWORD बाट)

npm run start:dev
```

Swagger API docs: `http://localhost:3005/api/docs`

**Note:** यो project यही sandbox भित्र `npx prisma generate` गर्न सकिएन (network restricted — `binaries.prisma.sh` access छैन)। तपाईंको आफ्नै मेसिनमा normal internet भएकोले माथिको command समस्या बिना चल्नेछ। Schema manually structurally verify गरिएको छ (brace balance, सबै relation/enum reference सही — 41 model, 16 enum, कुनै broken reference छैन)।

---

## के-के बनेको छ (Phase 1 — Complete)

### Core Platform
- **Auth** (Restaurant Owner) — Register (Tenant+Restaurant auto-create), Login, Refresh, Staff invite/manage
- **Customer Auth** — Register, Login, Guest checkout, Profile/Password update
- **Delivery Auth** — Self-register (independent rider) वा Owner ले थप्ने, Login
- **Platform Staff Auth** — छुट्टै login, Role-based permission (Super Admin ले आफ्नै team बनाउन सक्ने)

### Multi-Tenant Core
- RBAC (Role/Permission) — tenant-scoped
- Restaurant profile — Geolocation, Theme/Color, Business hours toggle, Service type (Delivery/Pickup/DineIn)
- Menu — Category, MenuItem (soft delete), ModifierGroup+Option (many-to-many)
- Managed Cuisine taxonomy (Platform Admin controlled, free-text होइन)

### Discovery (Customer-facing, Public)
- Near-me restaurant search — Haversine distance + weighted Ranking algorithm (distance+rating+popularity+sponsored)
- Rating/Distance/Recommended sort
- Menu search, Featured items/categories
- Public menu view + auto-translate (Google Translate API integration-ready)
- Delivery availability check (distance-tiered — Self vs Third-party vs Out-of-range)

### Order & Commerce
- Checkout — server-side price recalculation (tampering-proof), Modifier validation (ownership+required/min/max)
- Coupon — Generate, Validate, Apply (percentage/flat, usage limits)
- Distance-tiered Delivery Fee — Self-delivery radius vs Third-party radius vs Max radius, configurable fee type (Free/Flat/Per-km)
- Order Cancellation — window-based (customer), anytime (owner), Refund tracking
- Order Status History (audit trail)
- Review — Order-verified only (fake review रोक्ने)

### Delivery
- Delivery Person — Self-register or Owner-added, Location tracking
- Order dispatch — Distance-tiered logic (Self-delivery vs nearby-rider notification)
- Accept/Reject, Status update (auto-syncs Order status)
- Earnings tracking

### Storefront Builder (Owner customizable website)
- Banner slider (drag-drop reorder)
- Popup/Offer notification (scheduled)
- About/Contact/Social links, Section order (drag-drop)
- Featured items/categories (Popular section)

### Monetization (Platform Owner's Revenue)
- **Commission** — Per-restaurant %, Platform Admin controlled (0% allowed)
- **Settlement** — COD commission collection (periodic invoice generation, mark-paid)
- **Advertisement** — Homepage banner / Search boost / Popup ads, Owner requests → Admin approves (payment-gated)
- **Subscription/Membership** — Plans (Monthly/Quarterly/1-5 Year/Free), Auto-renew, **Daily cron job** (30/15/7/3/1-day expiry reminders to Owner+Admin, auto-renew execution, auto-suspend on expiry — domain-renewal-system जस्तै)

### Platform Admin (Super Admin) — Full Control
- Platform Staff RBAC — आफ्नै team, granular permission (Support Staff ले हेर्ने मात्र, Finance Admin ले commission मात्र... आदि)
- Restaurant suspend/reactivate, Commission override, **Full setting override** (support/emergency को लागि)
- **Activity Log** — प्रत्येक restaurant को पूरा audit trail
- Revenue Dashboard — Commission + Advertising, कुल Platform Revenue
- Refund processing, Delivery oversight, Content moderation

### Security (सबै audit गरिएको)
- SQL Injection — Prisma.sql parameterized queries (raw SQL जहाँ छ)
- Rate limiting (Throttler) — global + strict per-endpoint (login/register)
- Helmet security headers
- Image upload — magic-byte validation (mimetype spoof-proof), UUID filename (path traversal-proof)
- JWT — DB-verified real-time (deactivate भएपछि तुरुन्तै access बन्द)
- Multi-tenant isolation — हरेक query मा tenantId+restaurantId composite match

---

## ⏭️ अर्को Phase (जानाजान यता छाडिएको — Payment Gateway)

Payment अहिले **COD (Cash on Delivery) मात्र पूर्ण काम गर्छ**। बाँकी सबै provider **adapter pattern मा तयार अवस्थामा stub** छन् (clear error दिन्छन्, silent failure होइन):

- eSewa
- Khalti
- PayPal
- Credit Card (Stripe/similar)
- IPS
- PhonePay

**यी activate गर्न** (`src/modules/payment/providers/future-providers.stub.ts` भित्र):
1. `.env` मा त्यो provider को merchant code/secret key थप्ने
2. सम्बन्धित class को `initiate()` लाई त्यो gateway को actual API call ले replace गर्ने
3. Order/अरू कतै केही बदल्नु पर्दैन — Strategy pattern ले यही सजिलो बनाइदिएको छ

---

## Database Schema Highlights

- **41 Prisma models, 16 enums**
- Full ERD: Tenant→User→Role→Permission (RBAC) | Restaurant→Category→MenuItem→ModifierGroup (Menu) | Customer→Order→OrderItem→Delivery (Commerce) | SubscriptionPlan→RestaurantSubscription (Billing) | PlatformStaff→PlatformRole→PlatformPermission (Platform RBAC)

## जरूरी Known Limitations (भविष्यमा सुधार्ने)

1. **Price fields `Float` छन्**, `Decimal` होइन — ठूलो scale मा floating-point rounding जोखिम हुन सक्छ, भविष्यमा migrate गर्ने विचार गर्नुहोस्
2. **Tax calculation hardcoded 0** — देश/restaurant अनुसार tax rate logic अझै थप्नुपर्छ
3. **i18n (UI text)** अझै implement भएको छैन — Frontend मा गर्ने काम हो (backend मा menu-content translation भने तयार छ)
4. **Email/SMS provider वास्तविक रूपमा जोडिएको छैन** — `NotificationService` ले अहिले console-log गर्छ मात्र, production मा SendGrid/Twilio जस्ता provider जोड्नुपर्छ (`notification.service.ts` को TODO comment हेर्नुहोस्)
5. Fuzzy/typo-tolerant menu search अझै basic (`contains`) छ, `pg_trgm` extension भविष्यमा थप्न सकिन्छ

## Folder Structure

```
src/
├── modules/           ← 26 feature module (auth, order, discovery, delivery, subscription...)
├── common/
│   ├── filters/        ← Global exception handler
│   └── utils/           ← Haversine, Ranking algorithm, Delivery-fee calculator, Coupon generator
└── prisma/              ← DB service/module
prisma/
├── schema.prisma        ← पूरा DB schema
└── seed.ts               ← Bootstrap script (पहिलो Platform Admin)
```

---

**यो backend तपाईंको dream project हो — होसियारीपूर्वक, हरेक layer मा security र business logic दुबै ध्यान दिएर बनाइएको छ। अर्को phase मा Payment Gateway र Frontend (Next.js)।**
