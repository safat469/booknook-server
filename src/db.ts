import { Db, MongoClient } from "mongodb";

import { assertDatabaseConfigured, config } from "./config";

let clientPromise: Promise<MongoClient> | null = null;
let indexesPromise: Promise<void> | null = null;

/**
 * A single MongoClient is reused for the lifetime of the process. Serverless
 * platforms freeze the module between invocations, so the cached promise is
 * the cheapest way to avoid a new handshake on every request.
 */
export function getClient(): Promise<MongoClient> {
  assertDatabaseConfigured();

  if (!clientPromise) {
    const client = new MongoClient(config.mongoUri, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10,
    });
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(config.dbName);
}

export async function getBooks() {
  const db = await getDb();
  return db.collection<import("./types").BookDoc>("books");
}

export async function getBorrows() {
  const db = await getDb();
  return db.collection<import("./types").BorrowDoc>("borrows");
}

/**
 * Indexes are created once per process. They back the "newest first" listing,
 * the per-owner My Books query and the duplicate-borrow check.
 */
export async function ensureIndexes(): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const [books, borrows] = await Promise.all([getBooks(), getBorrows()]);
      await Promise.all([
        books.createIndex({ createdAt: -1 }),
        books.createIndex({ "addedBy.email": 1 }),
        borrows.createIndex({ userEmail: 1, bookId: 1 }, { unique: true }),
        borrows.createIndex({ userEmail: 1, borrowDate: -1 }),
      ]);
    })().catch((error) => {
      indexesPromise = null;
      throw error;
    });
  }

  return indexesPromise;
}
