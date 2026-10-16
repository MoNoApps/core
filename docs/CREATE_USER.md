# User Provisioning Utility (`scripts/create_user.ts`)

`scripts/create_user.ts` provides a unified, secure, and idempotent CLI and programmatic utility to create and manage user accounts across all roles (**Admin**, **Viewer**, and **User**) within the Core Platform MongoDB database.

---

## Quick Reference

| Action                          | Command                                                                    | Role Assigned                    |
| :------------------------------ | :------------------------------------------------------------------------- | :------------------------------- |
| **Create / Promote Admin**      | `npm run create:admin -- <email> <password> [name]`                        | `role: "admin"`, `admin: true`   |
| **Create Authenticated Viewer** | `npm run create:viewer -- <email> <password> [name]`                       | `role: "viewer"`, `admin: false` |
| **Create Standard User**        | `npm run create:user -- <email> <password> [name] [--role <role>]`         | `role: "user"`, `admin: false`   |
| **Direct TSX Execution**        | `npx tsx scripts/create_user.ts <email> <password> [name] [--role <role>]` | Derived from `--role`            |
| **Display CLI Help & Examples** | `npx tsx scripts/create_user.ts --help`                                    | N/A                              |

---

## Missing Parameter Diagnostics

When `<email>` or `<password>` is omitted, the CLI displays a clear, structured error message along with ready-to-run copy-pasteable examples for each user role:

```bash
$ npm run create:user

================================================================================
 Core Platform - User Provisioning CLI
================================================================================
❌ ERROR: Missing required argument(s): <email> and <password>.

--------------------------------------------------------------------------------
 SYNTAX:
   npm run create:user   -- <email> <password> [name] [--role admin|viewer|user]
   npm run create:admin  -- <email> <password> [name]
   npm run create:viewer -- <email> <password> [name]

--------------------------------------------------------------------------------
 AVAILABLE ROLES:
   • admin   : Full CRUD privileges, administrative access, user management.
   • viewer  : Authenticated read-only access across all business resources.
   • user    : Standard business operator (default role).
================================================================================
```

---

## Key Capabilities & Behavior

### 1. Idempotent Upsert & Role Updates

- **New Account:**
  - Inserts a new document into the `users` collection.
  - Automatically activates the user with `status: 1`.
  - Sets `role` (`"admin"`, `"viewer"`, or `"user"`).
  - Sets `admin: true` if role is `"admin"`, otherwise `admin: false`.
  - Derives a secure AES-256-CBC password hash keyed to the generated MongoDB ObjectId (`_id`).
- **Existing Account:**
  - Updates role and permissions accordingly.
  - Ensures account is active (`status: 1`).
  - Updates the display name if provided.
  - Re-hashes password if a plaintext password is supplied; preserves existing password if none is passed.
  - Sets `updatedAt: Date.now()`.

### 2. Cryptographic Security

- Passwords in Core Platform are hashed and encrypted via `helpers/utils.ts` (`createPwd` / `encryptString`) using AES-256-CBC.
- The encryption key and initialization vector (IV) are deterministically derived from the user's specific MongoDB ObjectId (`_id`):
  - $\text{Key} = \text{SHA256}(\text{userId})$
  - $\text{IV} = \text{MD5}(\text{userId})$
- Authentication verification uses constant-time string comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.

---

## Command Line Usage & Examples

### 1. Creating or Promoting an Administrator

```bash
npm run create:admin -- admin@example.com "AdminSecret123!" "Lead Administrator"
```

### 2. Creating an Authenticated Viewer (Read-Only)

```bash
npm run create:viewer -- auditor@example.com "AuditSecret123!" "Compliance Auditor"
```

### 3. Creating a Standard User

```bash
npm run create:user -- operator@example.com "OperatorPass123!" "Warehouse Manager" --role user
```

### 4. Automated CI / Environment Variables

```bash
USER_EMAIL=ci_admin@example.com USER_PASSWORD=CiPass123! USER_ROLE=admin npm run create:user
```

---

## Programmatic API

You can also import and use the user provisioning methods programmatically in test suites or migration scripts:

```typescript
import {
  createOrUpdateUser,
  createOrPromoteAdmin,
  createOrUpdateViewer,
} from "./scripts/create_user";

// Create or update viewer
const viewer = await createOrUpdateViewer(
  "auditor@example.com",
  "SecretPassword123!",
  "Security Auditor",
);

// Create custom role
const user = await createOrUpdateUser({
  email: "ops@example.com",
  password: "OpsPassword123!",
  name: "Operations",
  role: "user",
});
```
