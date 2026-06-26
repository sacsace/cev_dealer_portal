# CEV Dealer Portal

자동차 딜러용 **Repair Order / Job Card / Warranty Claim / Parts Shopping Mall** 통합 시스템입니다.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | NestJS 11, JWT Auth |
| Database | PostgreSQL + Prisma ORM |
| Infra | Docker Compose |

## Project Structure

```
CEV/
├── apps/
│   ├── api/          # NestJS REST API
│   └── web/          # Next.js Dealer/Admin UI
├── prisma/
│   ├── schema.prisma # DB schema (20 tables)
│   └── seed.ts       # Sample data
├── docker-compose.yml
└── package.json      # npm workspaces root
```

## Quick Start

### 1. Environment

```bash
cp .env.example .env
```

### 2. Database

```bash
docker compose up -d
npm install
npm run db:push
npm run db:seed
```

### 3. Run Development

```bash
# Terminal 1 - API (port 3001)
npm run dev:api

# Terminal 2 - Web (port 3000)
npm run dev:web
```

- Web: http://localhost:3000
- API: http://localhost:3001/api

## Demo Accounts

| Role | Login ID | Password |
|------|----------|----------|
| Dealer | `parts@frontierhyundai.com` or `FH001` | `Dealer@123` |
| Admin | `admin@cev.local` | `Admin@123` |
| Root | `root` (`lee@msventures.in`) | `admin123` |

## Phase 1 (Implemented)

- [x] JWT Login (Email / Dealer Code)
- [x] Dealer Portal layout (Header, Nav, Footer)
- [x] Part Search / List / Detail
- [x] Cart & Checkout & Order
- [x] Job Card List / Entry
- [x] Warranty Claim List / Entry
- [x] Admin Dashboard skeleton
- [x] RBAC guards (Root / Admin / User / Dealer)
- [x] Audit log on CRUD/Approve/Reject
- [x] PostgreSQL schema (users, dealers, parts, orders, job_cards, warranty_claims, etc.)

## Phase 2 (Planned)

- Admin CRUD screens (Dealer, User, Parts, Orders)
- Granular User permissions UI
- Order/Claim approval workflow UI
- Dashboard statistics API

## Phase 3 (Planned)

- Reports & Excel export
- Invoice PDF download
- Shipment tracking
- Email notifications

## API Endpoints

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/parts
GET    /api/cart
POST   /api/orders
GET    /api/job-cards
POST   /api/job-cards
GET    /api/warranty-claims
POST   /api/warranty-claims
GET    /api/lookup/categories
GET    /api/lookup/models
```

## License

Private - CEV Automotive
