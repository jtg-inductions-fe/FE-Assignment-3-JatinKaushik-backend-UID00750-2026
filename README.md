# Food Delivery Backend API

A robust, production-ready RESTful backend API built with **NestJS**, **Prisma ORM**, and **PostgreSQL**. Designed for multi-tenant food delivery and restaurant management, featuring atomic order management, multi-level soft deletes with cascades, stock tracking, and role-based access control.

---

## 🛠️ Tech Stack

- **Framework:** NestJS
- **ORM:** Prisma
- **Database:** PostgreSQL (with `@prisma/adapter-pg`)
- **Authentication:** JWT, HttpOnly Cookies, Token Rotation
- **Validation & Serialization:** `class-validator`, `class-transformer`
- **Testing:** Jest, Supertest

---

## ✨ Key Features

- **Multi-Tenant Authorization:** Role-based access control (`CUSTOMER`, `RESTAURANT_OWNER`) with scoped resource access.
- **Authentication Lifecycle:** OAuth-like flow with HttpOnly refresh cookies, automated token rotation, and `logoutAll` session revocation.
- **Soft-Delete Cascade Extension:** Custom Prisma extension for atomic multi-level soft deletion and PII anonymization.
- **Categorized Menu Management:** Category pagination, per-restaurant default category seeding, and duplicate item guards.
- **Atomic Order Processing:** Concurrent inventory stock decrements, line item pricing snapshots, and strict status transition state machines (`PENDING` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PREPARING` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`).

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js:** `>=18.x`
- **npm:** `>=9.x`
- **PostgreSQL:** Running instance

---

### 2. Installation & Setup

```bash
# Clone the repository
git clone [https://github.com/jtg-inductions-fe/FE-Assignment-3-JatinKaushik-backend-UID00750-2026.git](https://github.com/jtg-inductions-fe/FE-Assignment-3-JatinKaushik-backend-UID00750-2026.git)
cd FE-Assignment-3-JatinKaushik-backend-UID00750-2026

# Install dependencies
npm install
```

---

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/restaurant_db?schema=public"

# Auth Secrets & Expiry
JWT_ACCESS_SECRET="your-access-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

```

---

### 4. Database Setup

```bash
# Run database migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

```

---

### 5. Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

```

---

## 🧪 Running Tests

```bash
# Unit tests
npm run test

# End-to-end (E2E) integration tests
npm run test:e2e

```

---

## 📌 Main API Endpoints

### 🔐 Authentication (`/auth`)

- `POST /auth/register` - Register a new customer or restaurant owner
- `POST /auth/login` - Authenticate and receive tokens/cookies
- `POST /auth/refresh` - Rotate refresh token & obtain access token
- `POST /auth/logout` - Revoke current refresh token

### 👤 Users (`/users/me`)

- `GET /users/me` - Fetch profile details
- `PATCH /users/me` - Update profile
- `DELETE /users/me` - Soft-delete account & anonymize PII
- `GET /users/me/addresses` - List addresses
- `POST /users/me/addresses` - Add new address

### 🍽️ Restaurants & Menus

- `GET /restaurants` - List active restaurants
- `GET /restaurants/:id/menu` - Fetch categorized menu items
- `POST /restaurants/:id/menu-items` - Add menu item _(Owner only)_
- `PATCH /menu-items/:id` - Update menu item details _(Owner only)_
- `DELETE /menu-items/:id` - Soft-delete menu item _(Owner only)_

### 🛒 Orders (`/orders`)

- `POST /orders` - Place order with atomic stock decrement _(Customer only)_
- `GET /orders` - List paginated orders _(Scoped by Customer/Owner)_
- `GET /orders/:id` - Retrieve order details
- `PATCH /orders/:id/status` - Transition order status _(Owner only)_

---
