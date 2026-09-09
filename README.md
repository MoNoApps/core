<div align="center">

# MoNoApps Core

**Enterprise Full-Stack Foundation with Dynamic NoSQL CRUD, Real-Time Sync & React 19 SPA**

[![Node.js 24](https://img.shields.io/badge/Node.js-24%20LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-ES2024-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB 8](https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis 7](https://img.shields.io/badge/Redis-7%2B-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![CI Workflow](https://github.com/MoNoApps/core/actions/workflows/ci.yml/badge.svg)](https://github.com/MoNoApps/core/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Overview

**MoNoApps Core** is an enterprise-grade full-stack web and REST API framework designed for rapid development, dynamic schema-driven CRUD generation, real-time WebSocket synchronization, and high-performance extensibility.

Engineered from the ground up for **Node.js 24 (LTS)** and **TypeScript (ES2024)**, MoNoApps Core pairs an Express 5 backend with a **Vite + React 19** Single-Page Application (SPA) styled with live-switchable Bootswatch themes.

---

## Key Features

- **Node.js 24 (LTS) & ES2024:** Native ESM, top-level `await`, native crypto (`randomUUID`, `timingSafeEqual`), and native `node:test` test runner.
- ⚡ **Dynamic Configuration-Driven CRUD:** Define your models once in `config.json`, and MoNoApps automatically mounts REST endpoints, controllers, schema filters, and UI views.
- ⚛️ **Modern Frontend Architecture:** Powered by **Vite**, **React 19**, **TypeScript (TSX)**, and **Lucide Icons** with instant HMR and dynamic autoforms.
- **Real-Time Sync Engine:** Real-time data broadcasting powered by **Redis 7+ Pub/Sub** and **Socket.IO v4**.
- **MongoDB 8 Connection Pooling:** Modern typed Model abstraction layer with native async/await connection pooling.
- **Enterprise Security Hardening:**
- Constant-time password and token verification (`crypto.timingSafeEqual`)
- Token bucket rate limiting on sensitive routes
- HTTP security headers (`nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`)
- Recursive NoSQL injection sanitizers
- Automated response cleaners stripping private fields (passwords, tokens)
- **Zero Deprecations & 100% Type-Safe:** Fully typed with zero external legacy bundler warnings and 42 passing tests.

---

## Architecture & Directory Structure

```
.
├── api/                  # REST API routes, auth, and controllers
│   ├── account.ts        # User profile, session, and security endpoints
│   ├── commons.ts        # Authentication, ping, register, and theme routes
│   ├── controllers.ts    # Dynamic CRUD controllers layer
│   ├── register.ts       # Self-service user onboarding
│   └── routes.ts         # REST API server bootstrap & security middleware
├── helpers/              # Core business logic and infrastructure wrappers
│   ├── base.ts           # CBase asynchronous CRUD controller wrapper
│   ├── db.ts             # MongoDB 8 official driver wrapper with pooling
│   ├── email.ts          # Modern @sendgrid/mail delivery service
│   ├── filters.ts        # Schema whitelist, sanitization, and token guards
│   ├── generator.ts      # Dynamic API & web route generator
│   ├── inspector.ts      # Modular plugin discovery and loader
│   ├── manager.ts        # Token-based authentication & response formatter
│   ├── middleware.ts     # Security headers, CORS, rate limits, NoSQL guards
│   ├── models.ts         # Typed models layer wrapping collections
│   ├── ps.ts             # Redis 7+ async Pub/Sub client
│   ├── utils.ts          # Timing-safe cryptography and password hashing
│   └── zappy.ts          # Controller-response bridge
├── migrations/           # Database initialization and seeding scripts
│   ├── guest.ts          # Guest user provisioning
│   ├── seed.ts           # Initial collections and settings seeder
│   └── data/             # Default seed JSON payloads
├── src/                  # Centralized TypeScript application & React client
│   ├── client/           # Vite + React 19 Single-Page Application
│   │   ├── api/          # Typed API fetch client with token injection
│   │   ├── components/   # Navbar, Footer, Modal, DynamicForm generator
│   │   ├── context/      # AuthContext, SocketContext (live sync), ThemeContext
│   │   ├── pages/        # Home, ResourceList (CRUD), Account, Docs
│   │   ├── styles/       # CSS enhancements and responsive animations
│   │   └── main.tsx      # React 19 root bootstrap
│   ├── config.ts         # Zod-validated configuration loader
│   └── server.ts         # Startup orchestrator (API :1345, Web :1344, Socket.IO)
├── test/                 # Node 24 native test suite (tsx --test)
│   ├── api.integration.test.ts      # REST API endpoints suite
│   ├── auth.integration.test.ts     # Auth & account lifecycle tests
│   ├── database.integration.test.ts # Live MongoDB 8 & Redis 7 integration
│   ├── dynamic.integration.test.ts  # Dynamic CRUD & permissions tests
│   ├── security.test.ts             # Rate limits, headers, sanitization tests
│   └── web.integration.test.ts      # SPA routing & SSR fallback tests
├── web/                  # Express web server serving public/dist/ SPA
├── config.json           # Centralized configuration (Resources, Ports, Auth)
├── package.json          # Modern dependencies and scripts
└── vite.config.ts        # Vite configuration compiling React 19 to public/dist/
```

---

## Quickstart Guide

### Prerequisites

- **Node.js:** `>= 24.0.0 (LTS)`
- **MongoDB:** `>= 8.0`
- **Redis:** `>= 7.0`

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/MoNoApps/core.git
cd core
npm ci
```

### 2. Environment Configuration

Copy the sample environment file and customize your settings:

```bash
cp .env.example .env
```

Key environment variables:

| Variable         | Default                             | Description                        |
| :--------------- | :---------------------------------- | :--------------------------------- |
| `PORT_WEB`       | `1344`                              | Port for Web Server & React 19 SPA |
| `PORT_API`       | `1345`                              | Port for REST API service          |
| `PORT_REDIS`     | `6379`                              | Redis Pub/Sub port                 |
| `MONGODB_URI`    | `mongodb://127.0.0.1:27017/coreapp` | MongoDB 8 connection string        |
| `REDIS_URL`      | `redis://127.0.0.1:6379`            | Redis connection URL               |
| `SENDGRID_TOKEN` | _(optional)_                        | SendGrid API key for emails        |
| `MAIL_FROM`      | `noreply@monoapps.co`               | Outgoing sender email address      |

### 3. Database Initialization & Seeding

Seed default system collections and provision default users:

```bash
# Seed initial settings and collections
npx tsx migrations/seed.ts

# Provision guest user (if enabled)
npx tsx migrations/guest.ts
```

### 4. Development Workflow

Run the full stack with hot reload:

```bash
# Terminal 1: Run Express API & Web backend with Node 24 watch mode
npm run dev

# Terminal 2: Run Vite React 19 Frontend with Fast HMR (:3000)
npm run dev:client
```

---

## Production Build & Deployment

Build the optimized React 19 client bundle and start the unified server:

```bash
# Build TypeScript and compile Vite client into public/dist/
npm run build

# Start production server
npm start
```

---

## Configuration-Driven Dynamic CRUD (`config.json`)

MoNoApps automatically generates full REST CRUD endpoints and interactive client autoforms dynamically from `config.json`:

```json
{
  "resources": {
    "tasks": {
      "desc": "Task Management",
      "admin": false,
      "param": "task",
      "clean": { "internalSecret": 1 },
      "schema": {
        "title": { "type": "text", "required": true },
        "status": {
          "type": "select",
          "options": ["pending", "in_progress", "done"]
        },
        "dueDate": { "type": "date" }
      }
    }
  }
}
```

### Dynamic Endpoints Generated Automatically:

- `GET /tasks` $\rightarrow$ List tasks (paginated, with clean filters applied).
- `GET /tasks/:id` $\rightarrow$ Retrieve single task by ID.
- `POST /tasks` $\rightarrow$ Create task with schema validation.
- `PUT /tasks/:id` $\rightarrow$ Update task with whitelisted field validation.
- `DELETE /tasks/:id` $\rightarrow$ Remove task.

---

## Testing & Quality Assurance

MoNoApps Core features a comprehensive native test suite running directly on Node.js 24:

```bash
# Run complete test suite (Unit, Integration, Security, and Live DB)
npm test

# Run TypeScript typecheck
npm run typecheck

# Check Prettier compliance
npm run format:check

# Auto-format all code
npm run format
```

---

## Author & License

- **Author:** Dan Matz <[dan@monoapps.co](mailto:dan@monoapps.co)>
- **License:** [MIT](LICENSE)
