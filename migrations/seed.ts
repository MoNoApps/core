import { getCollection, getDb } from "../helpers/db";
import { createOrUpdateUser } from "../scripts/create_user";
import settings from "./data/settings.json";

function log(...args: unknown[]): void {
  if (process.env.NODE_ENV !== "test" || process.env.DEBUG) {
    console.log(...args);
  }
}

export async function seedDatabase(): Promise<void> {
  log("[Seed] Starting database migration & seed for MongoDB 9...");
  await getDb();

  const settingsCol = await getCollection("settings");
  try {
    await settingsCol.drop();
    log("[Seed] Dropped existing settings collection.");
  } catch (err: any) {
    // Collection might not exist yet
  }

  const items = Array.isArray(settings) ? settings : Object.values(settings);
  if (items.length > 0) {
    await settingsCol.insertMany(items as any);
    log(`[Seed] Seeded ${items.length} setting documents.`);
  }

  // Create TTL index for automatic token expiration cleanup (Issue #14)
  const tokensCol = await getCollection("tokens");
  try {
    await tokensCol.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 84000 },
    );
    log("[Seed] Ensured TTL index on tokens collection.");
  } catch (err: any) {
    // Index may already exist
  }

  // Seed default enterprise business resources (Categories, Warehouses, Suppliers)
  try {
    const categoriesCol = await getCollection("categories");
    const catCount = await categoriesCol.countDocuments({});
    if (catCount === 0) {
      const DEFAULT_CATEGORIES = [
        { name: "Electronics", slug: "electronics", icon: "cpu", active: true },
        { name: "Apparel", slug: "apparel", icon: "shirt", active: true },
        {
          name: "Home & Living",
          slug: "home-living",
          icon: "home",
          active: true,
        },
        { name: "Books", slug: "books", icon: "book", active: true },
        {
          name: "Sports & Outdoors",
          slug: "sports-outdoors",
          icon: "activity",
          active: true,
        },
        { name: "Automotive", slug: "automotive", icon: "car", active: true },
        { name: "Garden", slug: "garden", icon: "sun", active: true },
        {
          name: "Toys & Games",
          slug: "toys-games",
          icon: "gamepad-2",
          active: true,
        },
        {
          name: "Health & Beauty",
          slug: "health-beauty",
          icon: "heart",
          active: true,
        },
        {
          name: "Grocery",
          slug: "grocery",
          icon: "shopping-bag",
          active: true,
        },
      ];
      await categoriesCol.insertMany(DEFAULT_CATEGORIES as any);
      await categoriesCol.createIndex({ slug: 1 }, { unique: true });
      log(`[Seed] Seeded ${DEFAULT_CATEGORIES.length} default categories.`);
    }

    const warehousesCol = await getCollection("warehouses");
    const whCount = await warehousesCol.countDocuments({});
    if (whCount === 0) {
      const DEFAULT_WAREHOUSES = [
        {
          name: "West Coast Hub",
          code: "WH-LAX",
          city: "Los Angeles",
          country: "United States",
          capacity: 50000,
          active: true,
        },
        {
          name: "East Coast Distribution",
          code: "WH-NYC",
          city: "New York",
          country: "United States",
          capacity: 75000,
          active: true,
        },
        {
          name: "Central Logistics",
          code: "WH-CHI",
          city: "Chicago",
          country: "United States",
          capacity: 60000,
          active: true,
        },
        {
          name: "European Gateway",
          code: "WH-AMS",
          city: "Amsterdam",
          country: "Netherlands",
          capacity: 40000,
          active: true,
        },
      ];
      await warehousesCol.insertMany(DEFAULT_WAREHOUSES as any);
      await warehousesCol.createIndex({ code: 1 }, { unique: true });
      log(`[Seed] Seeded ${DEFAULT_WAREHOUSES.length} default warehouses.`);
    }

    const suppliersCol = await getCollection("suppliers");
    const supCount = await suppliersCol.countDocuments({});
    if (supCount === 0) {
      const DEFAULT_SUPPLIERS = [
        {
          name: "Apex Global Logistics",
          code: "SUP-001",
          contactPerson: "Alex Turner",
          email: "turner@apexlogistics.io",
          phone: "+1-555-0101",
          leadTimeDays: 5,
          rating: 4.8,
          active: true,
        },
        {
          name: "NovaTech Hardware",
          code: "SUP-002",
          contactPerson: "Elena Vance",
          email: "elena@novatech.com",
          phone: "+1-555-0102",
          leadTimeDays: 7,
          rating: 4.9,
          active: true,
        },
        {
          name: "Pacific Freight Partners",
          code: "SUP-003",
          contactPerson: "Kenji Sato",
          email: "sato@pacificfreight.co",
          phone: "+1-555-0103",
          leadTimeDays: 10,
          rating: 4.5,
          active: true,
        },
        {
          name: "BioGreen Organics",
          code: "SUP-004",
          contactPerson: "Claire Dubois",
          email: "claire@biogreen.fr",
          phone: "+33-1-555-0104",
          leadTimeDays: 4,
          rating: 4.7,
          active: true,
        },
      ];
      await suppliersCol.insertMany(DEFAULT_SUPPLIERS as any);
      await suppliersCol.createIndex({ code: 1 }, { unique: true });
      log(`[Seed] Seeded ${DEFAULT_SUPPLIERS.length} default suppliers.`);
    }

    const productsCol = await getCollection("products");
    const prodCount = await productsCol.countDocuments({});
    if (prodCount === 0) {
      const DEFAULT_PRODUCTS = [
        {
          name: "Ultra Wireless Noise-Cancelling Headphones",
          code: "PRD-100001",
          category: "Electronics",
          price: 249.99,
          cost: 110.0,
          taxes: 0.08,
          status: "active",
          image: "/images/products/placeholder.svg",
          comment: "Premium 40mm drivers with 30-hour battery life.",
        },
        {
          name: "Ergonomic Mechanical Keyboard RGB",
          code: "PRD-100002",
          category: "Electronics",
          price: 139.5,
          cost: 58.0,
          taxes: 0.08,
          status: "active",
          image: "/images/products/placeholder.svg",
          comment: "Hot-swappable switches with gasket mount dampening.",
        },
        {
          name: "Smart 4K Ultra-Wide Monitor 34-Inch",
          code: "PRD-100003",
          category: "Electronics",
          price: 599.0,
          cost: 320.0,
          taxes: 0.08,
          status: "active",
          image: "/images/products/placeholder.svg",
          comment: "Curved IPS panel with 144Hz refresh rate and USB-C hub.",
        },
        {
          name: "Organic Cotton Relaxed Crewneck Tee",
          code: "PRD-100004",
          category: "Apparel",
          price: 34.0,
          cost: 12.0,
          taxes: 0.08,
          status: "active",
          image: "/images/products/placeholder.svg",
          comment: "100% GOTS certified organic combed ring-spun cotton.",
        },
        {
          name: "Weatherproof Urban Commuter Backpack 28L",
          code: "PRD-100005",
          category: "Apparel",
          price: 119.0,
          cost: 45.0,
          taxes: 0.08,
          status: "active",
          image: "/images/products/placeholder.svg",
          comment: "Cordura nylon fabric with padded 16-inch laptop pocket.",
        },
        {
          name: "Minimalist Scandinavian Oak Dining Table",
          code: "PRD-100006",
          category: "Home & Living",
          price: 780.0,
          cost: 390.0,
          taxes: 0.08,
          status: "active",
          image: "/images/products/placeholder.svg",
          comment: "Solid white oak with protective matte lacquer finish.",
        },
        {
          name: "High-Performance Carbon Fiber Road Bike",
          code: "PRD-100007",
          category: "Sports & Outdoors",
          price: 1850.0,
          cost: 950.0,
          taxes: 0.08,
          status: "active",
          image: "/images/products/placeholder.svg",
          comment: "Shimano 105 groupset with aerodynamic frame geometry.",
        },
        {
          name: "Cold-Pressed Organic Extra Virgin Olive Oil 1L",
          code: "PRD-100008",
          category: "Grocery",
          price: 24.5,
          cost: 11.2,
          taxes: 0.08,
          status: "active",
          image: "/images/products/placeholder.svg",
          comment: "Single estate harvest from southern Peloponnese, Greece.",
        },
      ];
      await productsCol.insertMany(DEFAULT_PRODUCTS as any);
      await productsCol.createIndex({ code: 1 }, { unique: true });
      await productsCol.createIndex({ createdAt: -1 });
      log(`[Seed] Seeded ${DEFAULT_PRODUCTS.length} default products.`);
    }

    const customersCol = await getCollection("customers");
    const custCount = await customersCol.countDocuments({});
    if (custCount === 0) {
      const DEFAULT_CUSTOMERS = [
        {
          name: "Acme Industrial Corporation",
          email: "purchasing@acmecorp.com",
          phone: "+1-555-0191",
          company: "Acme Industrial Corp",
          tier: "vip",
          billingAddress:
            "100 Industrial Parkway, Suite 400, Chicago, IL 60601",
          shippingAddress: "100 Industrial Parkway, Dock 3, Chicago, IL 60601",
          status: "active",
        },
        {
          name: "Wayne Enterprises Global",
          email: "procurement@waynecorp.com",
          phone: "+1-555-0192",
          company: "Wayne Enterprises",
          tier: "vip",
          billingAddress: "1007 Mountain Drive, Gotham City, NJ 07001",
          shippingAddress: "Wayne Tower Loading Bay 2, Gotham City, NJ 07001",
          status: "active",
        },
        {
          name: "Stark Advanced Dynamics",
          email: "orders@starkdynamics.io",
          phone: "+1-555-0193",
          company: "Stark Dynamics",
          tier: "gold",
          billingAddress: "10880 Wilshire Blvd, Los Angeles, CA 90024",
          shippingAddress: "Facility 4, Point Dume, Malibu, CA 90265",
          status: "active",
        },
        {
          name: "Cyberdyne Systems Research",
          email: "supplies@cyberdyne.ai",
          phone: "+1-555-0194",
          company: "Cyberdyne Systems",
          tier: "silver",
          billingAddress: "18144 El Camino Real, Sunnyvale, CA 94087",
          shippingAddress: "Lab B Receiving, Sunnyvale, CA 94087",
          status: "active",
        },
        {
          name: "Initech Software Labs",
          email: "billing@initechlabs.com",
          phone: "+1-555-0195",
          company: "Initech Software",
          tier: "standard",
          billingAddress: "4120 Freemont Ave, Austin, TX 78701",
          shippingAddress: "4120 Freemont Ave, Austin, TX 78701",
          status: "active",
        },
      ];
      await customersCol.insertMany(DEFAULT_CUSTOMERS as any);
      await customersCol.createIndex({ email: 1 }, { unique: true });
      log(`[Seed] Seeded ${DEFAULT_CUSTOMERS.length} default customers.`);
    }

    const ordersCol = await getCollection("orders");
    const ordCount = await ordersCol.countDocuments({});
    if (ordCount === 0) {
      const DEFAULT_ORDERS = [
        {
          orderNumber: "ORD-2026-001",
          customer: "Acme Industrial Corporation",
          orderDate: "2026-03-15",
          status: "delivered",
          paymentStatus: "paid",
          totalAmount: 388.99,
          currency: "USD",
        },
        {
          orderNumber: "ORD-2026-002",
          customer: "Wayne Enterprises Global",
          orderDate: "2026-03-28",
          status: "shipped",
          paymentStatus: "paid",
          totalAmount: 1850.0,
          currency: "USD",
        },
        {
          orderNumber: "ORD-2026-003",
          customer: "Stark Advanced Dynamics",
          orderDate: "2026-04-02",
          status: "processing",
          paymentStatus: "authorized",
          totalAmount: 1198.0,
          currency: "USD",
        },
        {
          orderNumber: "ORD-2026-004",
          customer: "Cyberdyne Systems Research",
          orderDate: "2026-04-10",
          status: "pending",
          paymentStatus: "unpaid",
          totalAmount: 558.0,
          currency: "USD",
        },
      ];
      await ordersCol.insertMany(DEFAULT_ORDERS as any);
      await ordersCol.createIndex({ orderNumber: 1 }, { unique: true });
      log(`[Seed] Seeded ${DEFAULT_ORDERS.length} default orders.`);
    }

    const orderItemsCol = await getCollection("order_items");
    const oiCount = await orderItemsCol.countDocuments({});
    if (oiCount === 0) {
      const DEFAULT_ORDER_ITEMS = [
        {
          order: "ORD-2026-001",
          product: "Ultra Wireless Noise-Cancelling Headphones",
          quantity: 1,
          unitPrice: 249.99,
          discount: 0,
          subtotal: 249.99,
        },
        {
          order: "ORD-2026-001",
          product: "Ergonomic Mechanical Keyboard RGB",
          quantity: 1,
          unitPrice: 139.5,
          discount: 0.5,
          subtotal: 139.0,
        },
        {
          order: "ORD-2026-002",
          product: "High-Performance Carbon Fiber Road Bike",
          quantity: 1,
          unitPrice: 1850.0,
          discount: 0,
          subtotal: 1850.0,
        },
        {
          order: "ORD-2026-003",
          product: "Smart 4K Ultra-Wide Monitor 34-Inch",
          quantity: 2,
          unitPrice: 599.0,
          discount: 0,
          subtotal: 1198.0,
        },
      ];
      await orderItemsCol.insertMany(DEFAULT_ORDER_ITEMS as any);
      log(`[Seed] Seeded ${DEFAULT_ORDER_ITEMS.length} default order items.`);
    }

    const inventoryCol = await getCollection("inventory");
    const invCount = await inventoryCol.countDocuments({});
    if (invCount === 0) {
      const DEFAULT_INVENTORY = [
        {
          product: "Ultra Wireless Noise-Cancelling Headphones",
          warehouse: "West Coast Hub",
          quantityOnHand: 450,
          quantityReserved: 35,
          reorderLevel: 50,
          lastCountedAt: "2026-04-01",
        },
        {
          product: "Ergonomic Mechanical Keyboard RGB",
          warehouse: "East Coast Distribution",
          quantityOnHand: 280,
          quantityReserved: 20,
          reorderLevel: 40,
          lastCountedAt: "2026-04-01",
        },
        {
          product: "Smart 4K Ultra-Wide Monitor 34-Inch",
          warehouse: "Central Logistics",
          quantityOnHand: 115,
          quantityReserved: 12,
          reorderLevel: 25,
          lastCountedAt: "2026-04-05",
        },
        {
          product: "Weatherproof Urban Commuter Backpack 28L",
          warehouse: "European Gateway",
          quantityOnHand: 600,
          quantityReserved: 45,
          reorderLevel: 80,
          lastCountedAt: "2026-04-08",
        },
      ];
      await inventoryCol.insertMany(DEFAULT_INVENTORY as any);
      log(
        `[Seed] Seeded ${DEFAULT_INVENTORY.length} default inventory records.`,
      );
    }

    const invoicesCol = await getCollection("invoices");
    const invoiceCount = await invoicesCol.countDocuments({});
    if (invoiceCount === 0) {
      const DEFAULT_INVOICES = [
        {
          invoiceNumber: "INV-2026-001",
          order: "ORD-2026-001",
          customer: "Acme Industrial Corporation",
          issueDate: "2026-03-15",
          dueDate: "2026-04-15",
          subtotal: 388.99,
          taxAmount: 31.12,
          total: 420.11,
          status: "paid",
        },
        {
          invoiceNumber: "INV-2026-002",
          order: "ORD-2026-002",
          customer: "Wayne Enterprises Global",
          issueDate: "2026-03-28",
          dueDate: "2026-04-28",
          subtotal: 1850.0,
          taxAmount: 148.0,
          total: 1998.0,
          status: "paid",
        },
        {
          invoiceNumber: "INV-2026-003",
          order: "ORD-2026-003",
          customer: "Stark Advanced Dynamics",
          issueDate: "2026-04-02",
          dueDate: "2026-05-02",
          subtotal: 1198.0,
          taxAmount: 95.84,
          total: 1293.84,
          status: "issued",
        },
      ];
      await invoicesCol.insertMany(DEFAULT_INVOICES as any);
      await invoicesCol.createIndex({ invoiceNumber: 1 }, { unique: true });
      log(`[Seed] Seeded ${DEFAULT_INVOICES.length} default invoices.`);
    }

    const reviewsCol = await getCollection("reviews");
    const revCount = await reviewsCol.countDocuments({});
    if (revCount === 0) {
      const DEFAULT_REVIEWS = [
        {
          product: "Ultra Wireless Noise-Cancelling Headphones",
          customer: "Acme Industrial Corporation",
          rating: 5,
          title: "Industry Leading Audio & Isolation",
          comment:
            "Deploys seamlessly across our engineering hubs. Clear microphone fidelity and long battery stamina.",
          status: "published",
          verified: true,
        },
        {
          product: "Smart 4K Ultra-Wide Monitor 34-Inch",
          customer: "Stark Advanced Dynamics",
          rating: 5,
          title: "Crisp Display With Ultra Low Latency",
          comment:
            "Color grading is calibrated out of the box. Single cable USB-C docking powers high-drain workstations.",
          status: "published",
          verified: true,
        },
        {
          product: "Ergonomic Mechanical Keyboard RGB",
          customer: "Wayne Enterprises Global",
          rating: 4,
          title: "Solid Acoustic Profile",
          comment:
            "High tactile satisfaction for all-day typing. Software macro support is swift and intuitive.",
          status: "published",
          verified: true,
        },
      ];
      await reviewsCol.insertMany(DEFAULT_REVIEWS as any);
      log(`[Seed] Seeded ${DEFAULT_REVIEWS.length} default reviews.`);
    }
  } catch (err: any) {
    log("[Seed] Note on seeding business collections:", err?.message || err);
  }

  // Seed default demonstration accounts (Admin and Viewer)
  try {
    await createOrUpdateUser({
      email: "admin@example.com",
      password: process.env.ADMIN_PASSWORD || "Admin#2026!",
      name: "Administrator",
      role: "admin",
    });
    log("[Seed] Ensured default admin user (admin@example.com).");

    await createOrUpdateUser({
      email: "viewer@example.com",
      password: process.env.VIEWER_PASSWORD || "Viewer#2026!",
      name: "Demo Viewer",
      role: "viewer",
    });
    log("[Seed] Ensured default viewer user (viewer@example.com).");
  } catch (err: any) {
    log("[Seed] Note on seeding default accounts:", err?.message || err);
  }

  log("[Seed] Database migration completed successfully.");
}

export async function main(): Promise<void> {
  try {
    await seedDatabase();
  } catch (err) {
    if (process.env.NODE_ENV !== "test" || process.env.DEBUG) {
      console.error("[Seed] Database seed failed:", err);
    }
    if (process.env.NODE_ENV !== "test") {
      process.exitCode = 1;
    }
    throw err;
  }
}

const isDirectRun =
  Boolean(process.argv[1]?.endsWith("seed.ts")) ||
  Boolean(process.argv[1]?.endsWith("seed.js"));

if (process.env.NODE_ENV !== "test" && isDirectRun) {
  main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedDatabase;
