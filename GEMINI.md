# GEMINI.md - MoNoApps Core AI Agent Guide

## Project Overview

**MoNoApps Core** is an enterprise full-stack web and REST API foundation designed for dynamic NoSQL CRUD operations, real-time sync, schema-driven autoforms, and plugin extensibility.

- **Primary Repository:** `MoNoApps/core`
- **Target Runtime:** Node.js 24 (LTS) with native ESM & ES2024 features
- **Type System:** TypeScript (Target `ES2024`, Module `ESNext`, Resolution `bundler`)
- **Database & Cache:** MongoDB 8.x (`mongodb://127.0.0.1:27017/coreapp`) + Redis 7+ Pub/Sub (`redis://127.0.0.1:6379`)
- **Backend Architecture:** Express 5 unified REST API (`:1345`) + Web/SSR server (`:1344`) + Socket.IO v4 real-time engine
- **Frontend Architecture:** Modern Single-Page Application built with **Vite**, **React 19**, and **TypeScript (TSX)** in `src/client/`, styled with live-switchable Bootswatch themes
- **Security:** Timing-safe cryptography (`crypto.timingSafeEqual`), Redis-backed token bucket rate limiting, HTTP security headers (`nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`), and NoSQL query sanitization

---

## Directory Structure

```
.
├── api/                  # REST API route definitions and controllers
│   ├── account.ts        # User profile and account management
│   ├── commons.ts        # Auth, ping, signup, password recovery, theme endpoints
│   ├── controllers.ts    # Dynamic CRUD controllers per resource
│   ├── register.ts       # Self-service user registration logic
│   └── routes.ts         # REST API server bootstrap, security middleware, and routes
├── helpers/              # Core business logic, database wrappers, filters, and security
│   ├── base.ts           # CBase controller class wrapping data models with async/await
│   ├── db.ts             # MongoDB 8 official driver wrapper with connection pooling
│   ├── email.ts          # Email delivery service (SendGrid / fallback)
│   ├── filters.ts        # Schema filtering, sanitization, and permission guards
│   ├── generator.ts      # Dynamic API route & CRUD generator based on config.json
│   ├── inspector.ts      # Plugin discovery and loader
│   ├── manager.ts        # Token-based authentication & response formatter
│   ├── middleware.ts     # Security headers, CORS, rate limiting, and NoSQL sanitizers
│   ├── models.ts         # Typed models layer wrapping MongoDB 8 collections
│   ├── ps.ts             # Redis 7+ async Pub/Sub client
│   ├── utils.ts          # Timing-safe comparison, token creation & revocation
│   └── zappy.ts          # Dynamic controller-response bridge
├── migrations/           # Database seeding and initialization scripts
│   ├── guest.ts          # Guest user generation
│   ├── seed.ts           # Database reset & default collection seeding
│   └── data/             # Seed JSON payloads (users, settings, resources)
├── src/                  # Centralized TypeScript application & client source
│   ├── client/           # Vite + React 19 Single Page Application
│   │   ├── api/          # Typed API fetch client with token header injection
│   │   ├── components/   # Navbar, Footer, Modal, DynamicForm (autoform generator)
│   │   ├── context/      # AuthContext, SocketContext (live sync), ThemeContext
│   │   ├── pages/        # Home, ResourceList (CRUD), Account, Docs
│   │   ├── styles/       # Client CSS enhancements and animations
│   │   ├── types/        # Client TypeScript interfaces and models
│   │   ├── App.tsx       # Main router and view container
│   │   ├── config.ts     # Client configuration export
│   │   ├── index.html    # Vite HTML5 template
│   │   └── main.tsx      # React 19 root bootstrap
│   ├── config.ts         # Zod-validated configuration loader with env overrides
│   ├── server.ts         # Full stack startup orchestrator (API, Web, Socket.IO)
│   └── types/            # Backend TypeScript types and module declarations
├── test/                 # Node 24 native test suite (tsx --test)
│   ├── api.integration.test.ts # API REST integration tests
│   ├── base.test.ts            # CBase model wrapper async tests
│   ├── config.test.ts          # Zod schema config validation tests
│   ├── filters.test.ts         # Schema whitelist & cleaner filter tests
│   ├── security.test.ts        # Security regression tests (rate limits, headers, sanitization)
│   ├── utils.test.ts           # Crypto & password hashing unit tests
│   └── web.integration.test.ts # Web UI & SSR integration tests
├── web/                  # Web server bootstrap & static SPA serving
│   └── routes.ts         # Express web server serving public/dist/ SPA & SSR fallback
├── config.json           # Centralized configuration (Resources, Ports, Plugins, Auth)
├── package.json          # Modern dependencies and npm scripts
├── tsconfig.json         # TypeScript configuration (Target: ES2024, Module: ESNext)
└── vite.config.ts        # Vite configuration for building React 19 SPA to public/dist/
```

---

## Key Workflows & Commands

### Development & Execution (Node.js 24)

- **Run Server:** `npm run dev` (Runs `node --watch app.js` with instant restart on changes).
- **Run Frontend Dev Server:** `npm run dev:client` (Vite fast HMR development server on `:3000` with API proxying).
- **Build Client SPA:** `npm run build:client` (Compiles React 19 TSX into `public/dist/` in <100ms).
- **Full Production Build:** `npm run build` (Runs typecheck and Vite client bundle).
- **Database Seeding / Reset (MongoDB 8):** `npx tsx migrations/seed.ts`
- **Create Guest User:** `npx tsx migrations/guest.ts`

### Testing & Quality Gates

- **Run Test Suite:** `npm test` (Runs native Node 24 / tsx test runner executing unit, integration, and security tests).
- **Type Checking:** `npm run typecheck` (`tsc --noEmit` with zero errors).
- **Format Code:** `npm run format` (Auto-formats entire repository with Prettier).
- **Verify Format:** `npm run format:check` (Validates Prettier compliance).

---

## Core Architectural Patterns

### 1. Configuration-Driven Dynamic CRUD (`config.json`)

The application generates API routes and CRUD controllers dynamically at boot from the `resources` map in `config.json`:

- `resources.<name>.admin`: Boolean restricting endpoint to admin token.
- `resources.<name>.schema`: Permitted field whitelist and dynamic form schema.
- `resources.<name>.clean`: Fields to strip from JSON responses (e.g., passwords).
- `resources.<name>.exclude`: Suppress auto-generation for manual routing.

### 2. Token-Based Authentication

- Tokens are passed in HTTP Request Headers: `token: <TOKEN_UUID>`.
- Token lookup is handled against MongoDB 8 `tokens` collection.
- Passwords and keys are compared using constant-time `crypto.timingSafeEqual` (`safeEqual`).

### 3. Real-time Pub/Sub Synchronization

- Real-time updates broadcast via Redis 7+ pub/sub to Socket.IO v4 clients.
- The React SPA (`ResourceList.tsx`) subscribes to resource change events to auto-refresh table views.

---

## Guidelines for AI Agents & Contributors

1. **Target Node.js 24 & ES2024:**
   - Use native Node 24 capabilities: `node:crypto`, `node:test`, `node:assert`, native `fetch`, and top-level `await`.
   - Write all code in TypeScript (`.ts` / `.tsx`).
   - Use clean extensionless imports (`import * as utils from "../helpers/utils"`).
2. **MongoDB 8 Compatibility:**
   - Use `ModernModel` and `helpers/db.ts` with `async/await` and connection pooling.
3. **Preserve Dynamic Route Generator Contracts:**
   - Never break schema compatibility for `helpers/generator.ts`.
4. **Environment Variables:**
   - Always prioritize `process.env` overrides (`PORT`, `API_PORT`, `MONGODB_URI`, `REDIS_URL`, `SENDGRID_TOKEN`) via `src/config.ts`.
