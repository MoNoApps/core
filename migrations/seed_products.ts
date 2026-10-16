import { getCollection, getDb } from "../helpers/db";

export interface SeedProductsOptions {
  count?: number;
  batchSize?: number;
  drop?: boolean;
  quiet?: boolean;
}

export interface SeedProductsResult {
  totalSeeded: number;
  timeMs: number;
  throughput: number;
}

const CATEGORIES = [
  "Electronics",
  "Apparel",
  "Home",
  "Books",
  "Sports",
  "Automotive",
  "Garden",
  "Toys",
  "Health",
  "Grocery",
];

const ADJECTIVES = [
  "Ultra",
  "Pro",
  "Smart",
  "Eco",
  "Wireless",
  "Compact",
  "Premium",
  "Ergonomic",
  "Digital",
  "Turbo",
];

const NOUNS = [
  "Widget",
  "Gadget",
  "Device",
  "Sensor",
  "Module",
  "Adapter",
  "Hub",
  "Pack",
  "Tool",
  "Kit",
];

export async function seedProducts(
  options: SeedProductsOptions = {},
): Promise<SeedProductsResult> {
  const totalCount =
    options.count ??
    (process.env.COUNT ? parseInt(process.env.COUNT, 10) : 1_000_000);
  const batchSize =
    options.batchSize ??
    (process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE, 10) : 10_000);
  const shouldDrop =
    options.drop ?? (process.env.DROP !== "false" && process.env.DROP !== "0");
  const isQuiet =
    options.quiet ?? (process.env.NODE_ENV === "test" && !process.env.DEBUG);

  const log = (...args: unknown[]) => {
    if (!isQuiet) console.log(...args);
  };

  log(
    `[Seed Products] Initializing seed of ${totalCount.toLocaleString()} products...`,
  );
  const startTime = Date.now();

  await getDb();
  const productsCol = await getCollection("products");

  if (shouldDrop) {
    try {
      await productsCol.drop();
      log("[Seed Products] Dropped existing products collection.");
    } catch {
      // Collection might not exist yet
    }
  }

  const baseTimestamp = Date.now() - totalCount * 1000;
  let inserted = 0;

  while (inserted < totalCount) {
    const currentBatchCount = Math.min(batchSize, totalCount - inserted);
    const batch: Record<string, unknown>[] = new Array(currentBatchCount);

    for (let j = 0; j < currentBatchCount; j++) {
      const idx = inserted + j;
      const adj = ADJECTIVES[idx % ADJECTIVES.length];
      const cat = CATEGORIES[Math.floor(idx / 10) % CATEGORIES.length];
      const noun = NOUNS[Math.floor(idx / 100) % NOUNS.length];
      const name = `${adj} ${cat} ${noun} #${idx + 1}`;
      const price = Math.round(((idx % 500) * 1.45 + 5.99) * 100) / 100;
      const createdAt = new Date(baseTimestamp + idx * 1000);

      const cost = Math.round(price * 0.65 * 100) / 100;
      const status = idx % 15 === 0 ? "draft" : "active";

      batch[j] = {
        name,
        code: `PRD-${100_000 + idx}`,
        category: cat,
        price,
        cost,
        taxes: 0.08,
        status,
        image: "/images/products/placeholder.svg",
        comment: `Enterprise catalog product ${idx + 1} with standard warranty.`,
        createdAt,
        updatedAt: createdAt,
      };
    }

    await productsCol.insertMany(batch as any, { ordered: false });
    inserted += currentBatchCount;

    if (inserted % 50_000 === 0 || inserted === totalCount) {
      const elapsedSec = (Date.now() - startTime) / 1000;
      const rate =
        elapsedSec > 0 ? Math.round(inserted / elapsedSec) : inserted;
      const pct = ((inserted / totalCount) * 100).toFixed(1);
      const heapMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      log(
        `[Seed Products] Progress: ${inserted.toLocaleString()} / ${totalCount.toLocaleString()} (${pct}%) - ${rate.toLocaleString()} docs/sec - Heap: ${heapMb} MB`,
      );
    }
  }

  log("[Seed Products] Creating optimized query indexes...");
  try {
    await productsCol.createIndex({ code: 1 }, { unique: true });
    await productsCol.createIndex({ createdAt: -1 });
    await productsCol.createIndex({ name: 1 });
    log(
      "[Seed Products] Ensured indexes on { code: 1 }, { createdAt: -1 }, { name: 1 }.",
    );
  } catch (err: any) {
    log("[Seed Products] Index creation note:", err?.message || err);
  }

  const durationMs = Date.now() - startTime;
  const avgThroughput =
    durationMs > 0 ? Math.round((totalCount / durationMs) * 1000) : totalCount;

  log(
    `[Seed Products] Complete! Seeded ${totalCount.toLocaleString()} products in ${(
      durationMs / 1000
    ).toFixed(2)}s (${avgThroughput.toLocaleString()} docs/sec).`,
  );

  return {
    totalSeeded: totalCount,
    timeMs: durationMs,
    throughput: avgThroughput,
  };
}

export async function main(): Promise<void> {
  const cliCount = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;
  try {
    await seedProducts({ count: cliCount });
  } catch (err) {
    console.error("[Seed Products] Seeding failed:", err);
    process.exitCode = 1;
    throw err;
  }
}

const isDirectRun =
  Boolean(process.argv[1]?.endsWith("seed_products.ts")) ||
  Boolean(process.argv[1]?.endsWith("seed_products.js"));

if (process.env.NODE_ENV !== "test" && isDirectRun) {
  main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedProducts;
