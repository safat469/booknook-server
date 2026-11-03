import { Router } from "express";
import { ObjectId } from "mongodb";

import { getAuthUser, readUser, requireAuth } from "../auth";
import { getBooks, getBorrows } from "../db";
import { HttpError } from "../http-error";
import { isObjectId, serializeBook, toObjectId } from "../serialize";
import { isCategory, type BookDoc, type Category } from "../types";
import { httpUrl, requiredText, routeParam, wholeNumber } from "../validate";

export const booksRouter = Router();

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function categoryOrThrow(value: unknown): Category {
  if (!isCategory(value)) {
    throw new HttpError(400, "Choose a valid category.");
  }
  return value;
}

/** GET /books — public listing with optional search, category, owner and limit. */
booksRouter.get("/", async (req, res) => {
  const filter: Record<string, unknown> = {};

  const category = req.query.category;
  if (typeof category === "string" && category && category !== "All") {
    filter.category = categoryOrThrow(category);
  }

  const search = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: pattern }, { author: pattern }];
  }

  // `owner=me` powers My Books without trusting an email from the query string.
  if (req.query.owner === "me") {
    const user = readUser(req);
    if (!user) {
      throw new HttpError(401, "Please sign in to see your books.");
    }
    filter["addedBy.email"] = user.email;
  }

  const rawLimit = Number(req.query.limit);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.trunc(rawLimit), 60) : 0;

  const collection = await getBooks();
  const cursor = collection.find(filter).sort({ createdAt: -1 });
  if (limit) cursor.limit(limit);

  const [docs, total] = await Promise.all([cursor.toArray(), collection.countDocuments(filter)]);

  res.json({ books: docs.map(serializeBook), total });
});

/** GET /books/:id — private book details, plus whether this reader holds it. */
booksRouter.get("/:id", requireAuth, async (req, res) => {
  if (!isObjectId(routeParam(req.params.id))) {
    throw new HttpError(400, "That book id is not valid.");
  }

  const user = getAuthUser(req);
  const bookId = routeParam(req.params.id);
  const books = await getBooks();
  const book = await books.findOne({ _id: new ObjectId(bookId) });

  if (!book) {
    throw new HttpError(404, "This book could not be found.");
  }

  const borrows = await getBorrows();
  const existingBorrow = await borrows.findOne({ bookId, userEmail: user.email });

  res.json({
    book: {
      ...serializeBook(book),
      borrowedByMe: Boolean(existingBorrow),
    },
  });
});

/** POST /books — create a book owned by the signed-in reader. */
booksRouter.post("/", requireAuth, async (req, res) => {
  const user = getAuthUser(req);
  const body = req.body ?? {};

  const totalCopies = wholeNumber(body.totalCopies ?? 1, "Total copies", { min: 1, max: 99 });

  const doc: BookDoc = {
    title: requiredText(body.title, "Book title", { max: 160 }),
    author: requiredText(body.author, "Author name", { max: 120 }),
    category: categoryOrThrow(body.category),
    image: httpUrl(body.image, "Book image"),
    description: requiredText(body.description, "Short description", { min: 10, max: 2000 }),
    totalCopies,
    availableCopies: totalCopies,
    addedBy: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    createdAt: new Date(),
  };

  const books = await getBooks();
  const result = await books.insertOne(doc);

  res.status(201).json({
    message: "Book added to the shelf.",
    book: serializeBook({ ...doc, _id: result.insertedId }),
  });
});

/** PATCH /books/:id — the owner can edit their own book. */
booksRouter.patch("/:id", requireAuth, async (req, res) => {
  if (!isObjectId(routeParam(req.params.id))) {
    throw new HttpError(400, "That book id is not valid.");
  }

  const user = getAuthUser(req);
  const body = req.body ?? {};
  const books = await getBooks();
  const bookId = new ObjectId(routeParam(req.params.id));

  const current = await books.findOne({ _id: bookId, "addedBy.email": user.email });
  if (!current) {
    throw new HttpError(404, "You can only edit books that you added.");
  }

  const updates: Partial<BookDoc> = {};

  if (body.title !== undefined) updates.title = requiredText(body.title, "Book title", { max: 160 });
  if (body.author !== undefined) {
    updates.author = requiredText(body.author, "Author name", { max: 120 });
  }
  if (body.category !== undefined) updates.category = categoryOrThrow(body.category);
  if (body.image !== undefined) updates.image = httpUrl(body.image, "Book image");
  if (body.description !== undefined) {
    updates.description = requiredText(body.description, "Short description", {
      min: 10,
      max: 2000,
    });
  }

  if (body.totalCopies !== undefined) {
    const nextTotal = wholeNumber(body.totalCopies, "Total copies", { min: 1, max: 99 });
    const borrowedCount = current.totalCopies - current.availableCopies;

    if (nextTotal < borrowedCount) {
      throw new HttpError(
        400,
        `${borrowedCount} ${borrowedCount === 1 ? "copy is" : "copies are"} currently borrowed, so total copies cannot go below ${borrowedCount}.`,
      );
    }

    updates.totalCopies = nextTotal;
    updates.availableCopies = nextTotal - borrowedCount;
  }

  if (Object.keys(updates).length === 0) {
    throw new HttpError(400, "Nothing to update.");
  }

  const updated = await books.findOneAndUpdate(
    { _id: bookId, "addedBy.email": user.email },
    { $set: updates },
    { returnDocument: "after" },
  );

  if (!updated) {
    throw new HttpError(404, "This book could not be found.");
  }

  res.json({ message: "Book updated.", book: serializeBook(updated) });
});

/** DELETE /books/:id — remove the book and any borrows attached to it. */
booksRouter.delete("/:id", requireAuth, async (req, res) => {
  if (!isObjectId(routeParam(req.params.id))) {
    throw new HttpError(400, "That book id is not valid.");
  }

  const user = getAuthUser(req);
  const books = await getBooks();
  const borrows = await getBorrows();
  const bookId = routeParam(req.params.id);

  const deleted = await books.findOneAndDelete({
    _id: new ObjectId(bookId),
    "addedBy.email": user.email,
  });

  if (!deleted) {
    throw new HttpError(404, "You can only delete books that you added.");
  }

  await borrows.deleteMany({ bookId });

  res.json({ message: "Book removed from the shelf.", id: bookId });
});
