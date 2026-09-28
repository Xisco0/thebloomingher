# TheBloomingHer 🌿

> **TheBloomingHer** is a modern, full-stack wellness and herbal care e-commerce platform and content management system (CMS) built with **Next.js 14 (App Router)**, **Supabase**, **Cloudflare R2**, and **Flutterwave**.

---

## 🚀 Key Features

### 🛍️ Customer Storefront
* **Product Catalog & Discovery**: Fast filtering, searching, categorization, and detailed herbal product pages.
* **Shopping Cart & Checkout**: Interactive client-side cart synchronized with real-time stock levels and discount code validation.
* **Payment Integration**: Secure multi-gateway online payments powered by **Flutterwave** (hosted checkout, cards, bank transfer, USSD) with cryptographic webhook and callback verification.
* **Wellness Events & Workshops**: Community event calendar, ticket booking, and registration.
* **Customer Accounts**: Full profile management, order history tracking, and saved delivery addresses.
* **Social Authentication**: Google OAuth with PKCE flow via `@supabase/ssr` alongside traditional email/password credentials.

### 🛡️ Admin Dashboard & CMS
* **Product Management**: Full CRUD operations for products, inventory levels, variant pricing, and badge annotations.
* **Category Management**: Dynamic category hierarchy with SEO slugs and image banners.
* **Order Processing**: Live order status updates (Pending, Paid, Processing, Shipped, Delivered, Cancelled) and customer notifications.
* **Discount System**: Percentage and fixed discount codes with expiration dates, minimum spend requirements, and usage limits.
* **Customer & Review Management**: Customer directory and customer review moderation.
* **Role-Based Access Control (RBAC)**: Fine-grained permissions for Super Admins, Administrators, and Staff with mandatory first-time password resets.
* **Audit Logs**: Comprehensive event trail recording administrator activities for security and compliance.
* **Media Management**: Direct image uploads to **Cloudflare R2** with automatic signed URL proxying and fallback support.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14 (App Router)](https://nextjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) & Lucide Icons |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL & Supabase Auth SSR) |
| **Object Storage** | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) via AWS S3 SDK |
| **Payments** | [Flutterwave](https://flutterwave.com/) (Primary) & [Paystack](https://paystack.com/) (Fallback) |
| **Security & Tokens** | `jose` (JWTs) & `bcryptjs` |

---

## 📁 Project Structure

```text
thebloomingher/
├── src/
│   ├── app/                     # Next.js App Router routes & API endpoints
│   │   ├── (public)/            # Public storefront pages (shop, products, categories, events, cart)
│   │   ├── account/             # Customer authentication & account portal
│   │   ├── admin/               # Admin dashboard and management views
│   │   ├── api/                 # Backend REST endpoints (auth, products, orders, flutterwave, media)
│   │   └── auth/callback/       # Supabase OAuth PKCE callback exchange route
│   ├── components/              # Reusable UI components (layout, storefront, admin, auth)
│   ├── lib/                     # Database clients, auth helpers, and utilities
│   │   ├── auth/                # JWT session verification and OAuth callback handling
│   │   ├── supabase/            # Supabase SSR client, server, and admin instances
│   │   └── r2.ts                # Cloudflare R2 bucket connection
│   ├── repositories/            # Data access layer interfacing Supabase & local stores
│   ├── services/                # Business logic layer (Auth, Orders, Products, Flutterwave, CMS)
│   └── types/                   # TypeScript schemas and database interfaces
├── supabase/                    # Database migrations and seed scripts
└── public/                      # Static assets and media
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the project root based on `.env.example`:

```bash
# Public Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Flutterwave Payment Gateway Keys (Primary)
NEXT_PUBLIC_FLW_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxx-X
FLW_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxx-X
FLW_ENCRYPTION_KEY=FLWSECK_TESTxxxxxxxx
FLW_SECRET_HASH=your_webhook_secret_hash_here

# Paystack Payment Gateway Keys (Alternative / Fallback)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase Backend Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2 Object Storage
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET_NAME=thebloomingher-media
R2_PUBLIC_URL=

# WhatsApp Concierge Support Number (International Format)
NEXT_PUBLIC_WHATSAPP_NUMBER=+2348103641002
```

---

## 🔑 Supabase & Google OAuth Setup

1. In the **Supabase Dashboard** under `Authentication` → `URL Configuration`:
   - Set **Site URL** to `https://thebloomingher.com` (or `http://localhost:3000` in dev).
   - Add the following to **Redirect URLs**:
     ```text
     http://localhost:3000/**
     http://localhost:3000/auth/callback
     https://thebloomingher.com/**
     https://thebloomingher.com/auth/callback
     https://*.vercel.app/**
     https://*.vercel.app/auth/callback
     ```
2. In **Google Cloud Console** under `Credentials` → `OAuth 2.0 Client IDs`:
   - **Authorized redirect URIs**: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## 📜 License

Private & Proprietary © 2026 TheBloomingHer. All rights reserved.
