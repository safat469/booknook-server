import { getBooks, getClient, ensureIndexes } from "./db";
import { seedBooks } from "./seed-data";

async function main() {
  await ensureIndexes();
  const books = await getBooks();
  const existing = await books.countDocuments();

  if (existing > 0) {
    console.log(`[seed] shelf already has ${existing} books — nothing to do.`);
    return;
  }

  const docs = seedBooks();
  await books.insertMany(docs);
  console.log(`[seed] added ${docs.length} books to the shelf.`);
}

main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const client = await getClient().catch(() => null);
    await client?.close();
  });
