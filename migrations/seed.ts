import { getCollection, getDb } from "../helpers/db";
import settings from "./data/settings.json";

export async function seedDatabase(): Promise<void> {
  console.log("[Seed] Starting database migration & seed for MongoDB 8...");
  const db = await getDb();

  const settingsCol = await getCollection("settings");
  try {
    await settingsCol.drop();
    console.log("[Seed] Dropped existing settings collection.");
  } catch (err: any) {
    // Collection might not exist yet
  }

  const items = Array.isArray(settings) ? settings : Object.values(settings);
  if (items.length > 0) {
    await settingsCol.insertMany(items as any);
    console.log(`[Seed] Seeded ${items.length} setting documents.`);
  }

  // Create TTL index for automatic token expiration cleanup (Issue #14)
  const tokensCol = await getCollection("tokens");
  try {
    await tokensCol.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 84000 },
    );
    console.log("[Seed] Ensured TTL index on tokens collection.");
  } catch (err: any) {
    // Index may already exist
  }

  console.log("[Seed] Database migration completed successfully.");
}

if (process.env.NODE_ENV !== "test" && require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Seed] Database seed failed:", err);
      process.exit(1);
    });
}

export default seedDatabase;
