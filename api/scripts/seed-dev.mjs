// DEV ONLY: inserts clearly labelled sample data. Remove with `npm run unseed`.
import pg from "pg";

const PREFIX = "[DEV SAMPLE] ";
const mode = process.argv[2];

if (mode !== "seed" && mode !== "unseed") {
  console.error("Usage: node scripts/seed-dev.mjs seed|unseed");
  process.exit(1);
}
if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run sample-data script with NODE_ENV=production.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Copy .env.example to .env and edit it.",
  );
  process.exit(1);
}

const categories = [
  { key: "hot", name: "Hot drinks", sort: 1, visible: true },
  { key: "cold", name: "Cold drinks", sort: 2, visible: true },
  { key: "food", name: "Food", sort: 3, visible: true },
  { key: "hidden", name: "Hidden category", sort: 4, visible: false },
];

const items = [
  {
    cat: "hot",
    name: "Macchiato",
    price: 55,
    desc: "Espresso with a spot of milk foam.",
    tags: ["hot"],
    featured: true,
  },
  {
    cat: "hot",
    name: "Spris tea",
    price: 40,
    desc: "Tea layered with coffee.",
    tags: ["hot", "fasting"],
  },
  {
    cat: "hot",
    name: "Cappuccino",
    price: 70,
    desc: "Espresso, steamed milk and foam.",
    tags: ["hot"],
    available: false,
  },
  {
    cat: "cold",
    name: "Iced coffee",
    price: 85,
    desc: "Cold brew over ice.",
    tags: ["cold"],
    featured: true,
  },
  {
    cat: "cold",
    name: "Avocado juice",
    price: 90,
    desc: "Fresh layered juice.",
    tags: ["cold", "fasting", "vegetarian"],
  },
  {
    cat: "food",
    name: "Ful",
    price: 120,
    desc: "Seasoned fava beans with bread.",
    tags: ["fasting", "vegetarian"],
  },
  {
    cat: "food",
    name: "Chechebsa",
    price: 150,
    desc: "Pan-fried bread with spiced butter.",
    tags: ["non-fasting"],
    schedule: ["06:00", "11:00"],
  },
  {
    cat: "hidden",
    name: "Should not appear",
    price: 10,
    desc: "Proves hidden categories stay hidden.",
    tags: [],
  },
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query("begin");
  await client.query("delete from items where starts_with(name_en, $1)", [
    PREFIX,
  ]);
  await client.query("delete from categories where starts_with(name_en, $1)", [
    PREFIX,
  ]);

  if (mode === "seed") {
    const ids = {};
    for (const c of categories) {
      const r = await client.query(
        "insert into categories (name_en, sort_order, is_visible) values ($1, $2, $3) returning id",
        [PREFIX + c.name, c.sort, c.visible],
      );
      ids[c.key] = r.rows[0].id;
    }
    for (const i of items) {
      const [from, to] = i.schedule ?? [null, null];
      const r = await client.query(
        `insert into items (category_id, name_en, description_en, price_etb, is_available, is_featured, available_from, available_to)
         values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
        [
          ids[i.cat],
          PREFIX + i.name,
          i.desc,
          i.price,
          i.available ?? true,
          i.featured ?? false,
          from,
          to,
        ],
      );
      await client.query(
        "insert into item_tags (item_id, tag_id) select $1, id from tags where slug = any($2)",
        [r.rows[0].id, i.tags],
      );
    }
    console.log(
      `Seeded ${categories.length} categories and ${items.length} items.`,
    );
  } else {
    console.log("Removed all sample data.");
  }
  await client.query("commit");
} catch (err) {
  await client.query("rollback");
  throw err;
} finally {
  await client.end();
}
