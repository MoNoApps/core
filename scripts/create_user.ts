/**
 * @file scripts/create_user.ts
 * @description Unified User Provisioning Utility for Core Platform.
 *
 * This script creates a new user or updates an existing account with specific
 * roles ('admin', 'viewer', 'user') within the MongoDB database. It handles
 * secure AES-256-CBC key-derived password hashing (linked to the MongoDB ObjectId),
 * sets active status (`status: 1`), assigns roles, and sets the `admin` boolean.
 *
 * Usage:
 *   # Create an Administrator
 *   npm run create:admin -- <email> <password> [name]
 *
 *   # Create an Authenticated Viewer (Read-Only)
 *   npm run create:viewer -- <email> <password> [name]
 *
 *   # Create a Standard User or custom role
 *   npm run create:user -- <email> <password> [name] [--role admin|viewer|user]
 *
 *   # Run directly with tsx
 *   npx tsx scripts/create_user.ts <email> <password> [name] [--role <role>]
 *
 * @module scripts/create_user
 */

import { getCollection, closeDb } from "../helpers/db";
import * as utils from "../helpers/utils";
import type { User } from "../src/types/index";

export type UserRole = "admin" | "viewer" | "user";

export interface CreateUserOptions {
  email: string;
  password?: string;
  name?: string;
  role?: UserRole | string;
  status?: number;
}

/**
 * Creates a new user account or updates an existing user's role and credentials.
 *
 * @param {CreateUserOptions} options - User creation configuration.
 * @returns {Promise<User>} The created or updated User document.
 * @throws {Error} If the email is invalid or if password is missing for a new user.
 */
export async function createOrUpdateUser(
  options: CreateUserOptions,
): Promise<User> {
  const email = options.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Valid email address is required.");
  }

  const rawRole = (options.role || "user").toLowerCase().trim();
  const role: UserRole =
    rawRole === "admin" || rawRole === "viewer" ? rawRole : "user";
  const isAdmin = role === "admin";
  const defaultName =
    role === "admin" ? "Administrator" : role === "viewer" ? "Viewer" : "User";
  const name = options.name?.trim() || defaultName;
  const status = options.status ?? 1;

  const usersCol = await getCollection<User>("users");
  const existing = await usersCol.findOne({ email });

  if (existing) {
    const userId = (existing._id as any).toString();
    const updateFields: any = {
      role,
      admin: isAdmin,
      status,
      name: options.name ? name : existing.name || name,
      updatedAt: Date.now(),
    };

    if (options.password) {
      const { pwd } = utils.createPwd({
        key: userId,
        text: options.password,
      });
      updateFields.password = pwd;
    }

    await usersCol.updateOne(
      { _id: existing._id } as any,
      { $set: updateFields } as any,
    );

    return { ...existing, ...updateFields } as User;
  }

  if (!options.password) {
    throw new Error(
      `Password is required when creating a new ${role} user account.`,
    );
  }

  const newUserDoc: Partial<User> = {
    name,
    email,
    role,
    admin: isAdmin,
    status,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const inserted = await usersCol.insertOne(newUserDoc as any);
  const userId = inserted.insertedId.toString();
  const { pwd } = utils.createPwd({ key: userId, text: options.password });

  await usersCol.updateOne(
    { _id: inserted.insertedId } as any,
    { $set: { password: pwd } } as any,
  );

  return { ...newUserDoc, _id: inserted.insertedId, password: pwd } as User;
}

/**
 * Backward-compatible helper for administrator provisioning.
 */
export async function createOrPromoteAdmin(
  email: string,
  rawPassword?: string,
  name = "Administrator",
): Promise<User> {
  return createOrUpdateUser({
    email,
    password: rawPassword,
    name,
    role: "admin",
  });
}

/**
 * Helper for viewer provisioning.
 */
export async function createOrUpdateViewer(
  email: string,
  rawPassword?: string,
  name = "Viewer",
): Promise<User> {
  return createOrUpdateUser({
    email,
    password: rawPassword,
    name,
    role: "viewer",
  });
}

/**
 * Prints comprehensive CLI usage with actionable examples when parameters are missing.
 */
export function printUsageExamples(errorMessage?: string): void {
  const banner = errorMessage
    ? `\n❌ ERROR: ${errorMessage}\n`
    : `\nℹ️  Core Platform - User Provisioning CLI Documentation\n`;

  console.log(`
================================================================================
 Core Platform - User Provisioning CLI
================================================================================${banner}
--------------------------------------------------------------------------------
 SYNTAX:
   npm run create:user   -- <email> <password> [name] [--role admin|viewer|user]
   npm run create:admin  -- <email> <password> [name]
   npm run create:viewer -- <email> <password> [name]

   # Direct execution via npx tsx:
   npx tsx scripts/create_user.ts <email> <password> [name] [--role <role>]

--------------------------------------------------------------------------------
 AVAILABLE ROLES:
   • admin   : Full CRUD privileges, administrative access, user management.
   • viewer  : Authenticated read-only access across all business resources.
   • user    : Standard business operator (default role).

--------------------------------------------------------------------------------
 CONCRETE EXAMPLES:

  1. Create or Promote an Administrator:
     npm run create:admin -- admin@example.com "AdminSecret123!" "Lead Admin"
     npm run create:user  -- ops@example.com "OpsSecret123!" "Ops Manager" --role admin

  2. Create an Authenticated Viewer (Read-Only):
     npm run create:viewer -- auditor@example.com "AuditPass123!" "Security Auditor"
     npm run create:user   -- viewer@example.com "Viewer123!" "Catalog Viewer" --role viewer

  3. Create a Standard Business User:
     npm run create:user -- operator@example.com "OperatorPass123!" "Store Operator" --role user

  4. Environment Variables (Automated / CI Setup):
     USER_EMAIL=lead@example.com USER_PASSWORD=Secret123! USER_ROLE=admin npm run create:user
     ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=MySecret123! npm run create:admin
     VIEWER_EMAIL=guest_audit@example.com VIEWER_PASSWORD=Audit123! npm run create:viewer

================================================================================
`);
}

/**
 * Parses CLI arguments supporting flags (--role, -r, --help, -h) and positional values.
 */
export function parseArgs(rawArgs: string[]): {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  isHelp: boolean;
} {
  const isHelp = rawArgs.includes("--help") || rawArgs.includes("-h");
  let role: UserRole | undefined;
  const positionals: string[] = [];

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === "--help" || arg === "-h") {
      continue;
    } else if (arg === "--role" || arg === "-r") {
      const next = rawArgs[i + 1]?.toLowerCase();
      if (next === "admin" || next === "viewer" || next === "user") {
        role = next;
        i++;
      }
    } else if (arg.startsWith("--role=")) {
      const val = arg.split("=")[1]?.toLowerCase();
      if (val === "admin" || val === "viewer" || val === "user") {
        role = val;
      }
    } else if (arg === "--admin") {
      role = "admin";
    } else if (arg === "--viewer") {
      role = "viewer";
    } else if (arg === "--user") {
      role = "user";
    } else if (!arg.startsWith("-")) {
      positionals.push(arg);
    }
  }

  return {
    email: positionals[0],
    password: positionals[1],
    name: positionals[2],
    role,
    isHelp,
  };
}

/**
 * CLI execution entrypoint.
 */
export async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.isHelp) {
    printUsageExamples();
    return;
  }

  // Derive role priority: CLI flag > Environment variable > Fallback based on script name
  const envRole = process.env.USER_ROLE?.toLowerCase() as UserRole | undefined;
  const scriptName = process.argv[1] || "";
  const scriptRole: UserRole = scriptName.includes("create_admin")
    ? "admin"
    : scriptName.includes("create_viewer")
      ? "viewer"
      : "user";

  const role: UserRole = parsed.role || envRole || scriptRole;

  // Resolve email and password from CLI positional args or env vars
  const email =
    parsed.email ||
    process.env.USER_EMAIL ||
    (role === "admin"
      ? process.env.ADMIN_EMAIL
      : role === "viewer"
        ? process.env.VIEWER_EMAIL
        : undefined);

  const password =
    parsed.password ||
    process.env.USER_PASSWORD ||
    (role === "admin"
      ? process.env.ADMIN_PASSWORD
      : role === "viewer"
        ? process.env.VIEWER_PASSWORD
        : undefined);

  const name =
    parsed.name ||
    process.env.USER_NAME ||
    (role === "admin"
      ? process.env.ADMIN_NAME
      : role === "viewer"
        ? process.env.VIEWER_NAME
        : undefined);

  // If parameters are missing, output rich examples and exit with error code
  if (!email || !password) {
    const missing: string[] = [];
    if (!email) missing.push("<email>");
    if (!password) missing.push("<password>");
    printUsageExamples(
      `Missing required argument(s): ${missing.join(" and ")}.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`\n======================================================`);
  console.log(` Core Platform - User Provisioning`);
  console.log(`======================================================`);
  console.log(` Target Email: ${email}`);
  console.log(
    ` Target Role:  ${role.toUpperCase()} (admin: ${role === "admin"})`,
  );
  if (name) console.log(` Target Name:  ${name}`);

  try {
    const user = await createOrUpdateUser({
      email,
      password,
      name,
      role,
    });

    console.log(`\n✅ Account successfully provisioned:`);
    console.log(`   ID:     ${user._id}`);
    console.log(`   Email:  ${user.email}`);
    console.log(`   Name:   ${user.name}`);
    console.log(`   Role:   ${user.role || (user.admin ? "admin" : "user")}`);
    console.log(`   Admin:  ${user.admin}`);
    console.log(`   Status: Active (${user.status})`);
    console.log(`\n Credentials for login (http://localhost:3000/ or :1344):`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`======================================================\n`);
  } catch (err: any) {
    console.error(`\n❌ Failed to provision user:`, err.message);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

// Automatically execute main when run directly as a script (not in tests)
if (process.env.NODE_ENV !== "test" && require.main === module) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
