<div align="center">

# Core Platform

**Enterprise Full-Stack Foundation with Dynamic NoSQL CRUD, Redis Event Broadcasting & React 19 SPA**

[![Node.js 24](https://img.shields.io/badge/Node.js-24%20LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-ES2024-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB 9](https://img.shields.io/badge/MongoDB-9.x-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis 7](https://img.shields.io/badge/Redis-7%2B-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Overview

**Core** is an enterprise-grade full-stack web and REST API framework designed for rapid development, dynamic schema-driven CRUD generation, Redis event broadcasting, and high-performance extensibility.

Engineered from the ground up for **Node.js 24 (LTS)** and **TypeScript (ES2024)**, Core pairs an Express 5 backend with a **Vite + React 19** Single-Page Application (SPA) styled with a bespoke offline CSS design system featuring live theme switching.

---

## Key Features

- **Node.js 24 (LTS) & ES2024:** Native ESM, top-level `await`, native crypto (`randomUUID`, `timingSafeEqual`), and native `node:test` test runner.
- ⚡ **Dynamic Configuration-Driven CRUD:** Define your models once in `config.json`, and the framework automatically mounts REST endpoints, controllers, schema filters, and UI views.
- ⚛️ **Modern Frontend Architecture:** Powered by **Vite**, **React 19**, **TypeScript (TSX)**, and **Lucide Icons** with instant HMR and dynamic autoforms.
- **Redis 7+ Pub/Sub Event Broadcasting:** Decoupled asynchronous change propagation (`Core::events`) for external services and background workers without stateful WebSocket overhead (Socket.IO retired in favor of clean REST APIs and event queues).
- **MongoDB 9 Connection Pooling:** Modern typed Model abstraction layer with native async/await connection pooling.
- **Enterprise Security Hardening:**
  - Constant-time password and token verification (`crypto.timingSafeEqual`)
  - Token bucket rate limiting on sensitive routes
  - HTTP security headers (`nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`)
  - Recursive NoSQL injection sanitizers
  - Automated response cleaners stripping private fields (passwords, tokens)
- **Zero Deprecations & 100% Type-Safe:** Fully typed with zero external legacy bundler warnings and 214 tests across 63 suites.

---

## Architecture & Directory Structure

```
.
├── api/                  # REST API routes, auth, and controllers
│   ├── account.ts        # User profile, session, and security endpoints
│   ├── auth.ts           # Authentication credentials & Gravatar hashing
│   ├── commons.ts        # Authentication, login, ping, and properties routes
│   ├── controllers.ts    # Dynamic CRUD controllers layer
│   └── routes.ts         # REST API server bootstrap & security middleware
├── docs/                 # Detailed platform documentation
│   ├── ARCHITECTURE.md   # Architectural design, event broadcasting & data flows
│   ├── CONFIGURATION.md  # Configuration schema specification & validator guide
│   ├── CREATE_USER.md    # User provisioning CLI reference & examples
│   └── DEPLOYMENT.md     # Production deployment, Docker Compose & Nginx setup
├── helpers/              # Core business logic and infrastructure wrappers
│   ├── base.ts           # BaseController asynchronous CRUD controller wrapper
│   ├── configValidator.ts# Zod configuration and resource schema validator
│   ├── db.ts             # MongoDB 9 official driver wrapper with pooling
│   ├── filters.ts        # Schema whitelist, sanitization, and token guards
│   ├── generator.ts      # Dynamic API & web route generator
│   ├── inspector.ts      # Modular plugin discovery and loader
│   ├── manager.ts        # Token-based authentication & response formatter
│   ├── middleware.ts     # Security headers, CORS, rate limits, NoSQL guards
│   ├── models.ts         # Typed models layer wrapping collections
│   ├── ps.ts             # Redis 7+ async Pub/Sub client
│   ├── resource.ts       # ResourceHandler: per-resource HTTP CRUD handler
│   └── utils.ts          # Timing-safe cryptography and password hashing
├── migrations/           # Database initialization and seeding scripts
│   ├── seed.ts           # Initial collections and settings seeder
│   ├── seed_products.ts  # Bulk product data generation
│   └── data/             # Default seed JSON payloads
├── scripts/              # User administration and validation CLI tools
│   ├── create_user.ts    # Single unified user provisioning CLI (admin/viewer/user)
│   └── validate_config.ts# Configuration schema validator CLI
├── src/                  # Centralized TypeScript application & React client
│   ├── client/           # Vite + React 19 Single-Page Application
│   │   ├── api/          # Typed API fetch client with token injection
│   │   ├── components/   # Navbar, Footer, Modal, DynamicForm generator
│   │   ├── context/      # AuthContext, ThemeContext
│   │   ├── pages/        # Home, ResourceList (CRUD), Account, Docs
│   │   ├── styles/       # CSS enhancements and responsive animations
│   │   └── main.tsx      # React 19 root bootstrap
│   ├── config.ts         # Zod-validated configuration loader
│   └── server.ts         # Startup orchestrator (API :1345, Web :1344)
├── test/                 # Node 24 native test suite (tsx --test)
│   ├── api.integration.test.ts      # REST API endpoints suite
│   ├── auth.integration.test.ts     # Auth & account lifecycle tests
│   ├── client_routing.test.ts       # Client SPA routing & fallback tests
│   ├── config_validator.test.ts     # Configuration schema validation tests
│   ├── create_user.test.ts          # CLI & programmatic user provisioning tests
│   ├── database.integration.test.ts # Live MongoDB 9 & Redis 7 integration
│   ├── dynamic.integration.test.ts  # Dynamic CRUD & permissions tests
│   ├── security.test.ts             # Rate limits, headers, sanitization tests
│   ├── viewer.test.ts               # Viewer read-only & RBAC isolation tests
│   └── web.integration.test.ts      # SPA routing & middleware integration tests
├── web/                  # Express web server serving public/dist/ SPA
├── config.json           # Centralized configuration (Resources, Ports, Auth)
├── core.conf             # Nginx reverse proxy configuration
├── docker-compose.yml    # Multi-container Docker Compose definition
├── Dockerfile            # Container build recipe
├── package.json          # Modern dependencies and scripts
└── vite.config.mts       # Vite configuration compiling React 19 to public/dist/
```

---

## Quickstart Guide

### Prerequisites

- **Node.js:** `>= 24.0.0 (LTS)`
- **MongoDB:** `>= 9.0`
- **Redis:** `>= 7.0`

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/example/core.git
cd core
npm ci
```

### 2. Environment Configuration

Copy the sample environment file and customize your settings:

```bash
cp .env.example .env
```

Key environment variables:

| Variable      | Default                             | Description                        |
| :------------ | :---------------------------------- | :--------------------------------- |
| `PORT_WEB`    | `1344`                              | Port for Web Server & React 19 SPA |
| `PORT_API`    | `1345`                              | Port for REST API service          |
| `PORT_REDIS`  | `6379`                              | Redis Pub/Sub port                 |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/coreapp` | MongoDB 9 connection string        |
| `REDIS_URL`   | `redis://127.0.0.1:6379`            | Redis connection URL               |

### 3. Database Initialization & Seeding

Seed default system collections or provision user accounts across roles:

```bash
# Seed initial settings, collections, and demo accounts (admin & viewer)
npx tsx migrations/seed.ts

# Generate sample catalog data
npm run seed:products

# Provision custom admin account with positional arguments
npm run create:admin -- admin@example.com "AdminSecret123!" "Lead Administrator"

# Provision authenticated viewer account (read-only catalog & business data)
npm run create:viewer -- auditor@example.com "AuditorPass123!" "Security Auditor"

# Provision standard business user
npm run create:user -- operator@example.com "OperatorPass123!" "Store Operator" --role user
```

For full CLI options and role management, see [User Provisioning Guide](docs/CREATE_USER.md).

### 4. Development Workflow

Run the full stack with hot reload:

```bash
# Terminal 1: Run Express API & Web backend with Node 24 watch mode
npm run dev

# Terminal 2: Run Vite React 19 Frontend with Fast HMR (:3000)
npm run dev:client
```

---

## Docker Compose Quickstart

Run the complete multi-tier stack (Express App, MongoDB 9, Redis 7) using Docker Compose:

```bash
# Start all containers in the background
docker compose up -d

# Stream application logs
docker compose logs -f app

# Tear down containers
docker compose down
```

For more details on networking, healthchecks, and volumes, see [Deployment Guide](docs/DEPLOYMENT.md).

---

## Configuration & Schema Validation (`config.json`)

Core automatically generates full REST CRUD endpoints and interactive client autoforms dynamically from `config.json`:

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

Validate and auto-fix configuration files with the built-in validator CLI:

```bash
# Inspect and validate configuration
npm run validate:config

# Enforce strict validation
npx tsx scripts/validate_config.ts --strict

# Automatically apply recommended fixes
npx tsx scripts/validate_config.ts --fix
```

For complete field type specifications, see [Configuration Guide](docs/CONFIGURATION.md).

---

## Testing & Quality Assurance

Core features a comprehensive native test suite running directly on Node.js 24:

```bash
# Run complete test suite (Unit, Integration, Security, and Live DB)
npm test

# Run test suite with native coverage report
npm run test:coverage

# Generate LCOV coverage report for CI
npm run test:coverage:lcov

# Run TypeScript typecheck
npm run typecheck

# Check Prettier compliance
npm run format:check

# Auto-format all code
npm run format
```

---

## Documentation Index

- [System Architecture](docs/ARCHITECTURE.md) &mdash; Architectural design, Socket.IO retirement, Redis event broadcasting, and data flows.
- [Configuration Specification](docs/CONFIGURATION.md) &mdash; Complete `config.json` schema reference and validator CLI.
- [User Provisioning Guide](docs/CREATE_USER.md) &mdash; RBAC management, password security, and CLI usage.
- [Deployment & Operations](docs/DEPLOYMENT.md) &mdash; Production builds, Docker Compose, Nginx reverse proxy, and environment variables.

---

## Author & License

- **Contributors:** Core Platform Contributors
- **License:** [MIT](LICENSE)
