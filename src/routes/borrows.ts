import { Router } from "express";
import { ObjectId } from "mongodb";

import { getAuthUser, requireAuth } from "../auth";
import { getBooks, getBorrows } from "../db";
import { HttpError } from "../http-error";
import { isObjectId, serializeBorrow, toObjectId } from "../serialize";
import type { BorrowDoc } from "../types";
import { routeParam } from "../validate";

export const borrowsRouter = Router();

const DAY = 24 * 60 * 60 * 1000;

/** POST /borrows — borrow one copy and hold it until the chosen return date. */
borrowsRouter.post("/", requireAuth, async (req, res) => {
  const user = getAuthUser(req);
  const body = req.body ?? {};

  if (typeof body.bookId !== "string" || !isObjectId(body.bookId)) {
    throw new HttpError(400, "Choose a valid book to borrow.");
  }

  const now = new Date();
  let returnDate: Date;

  if (body.returnDate === undefined || body.returnDate === null || body.returnDate === "") {
    returnDate = new Date(now.getTime() + 7 * DAY);
  } else {
    returnDate = new Date(body.returnDate);
    if (Number.isNaN(returnDate.getTime())) {
      throw new HttpError(400, "Choose a valid return date.");
    }
    if (returnDate.getTime() <= now.getTime()) {
      throw new HttpError(400, "The return date must be in the future.");
    }
    if (returnDate.getTime() > now.getTime() + 60 * DAY) {
      throw new HttpError(400, "Books can be borrowed for at most 60 days.");
    }
  }

  const books = await getBooks();
  const borrows = await getBorrows();
  const bookId = body.bookId;

  const book = await books.findOne({ _id: new ObjectId(bookId) });
  if (!book) {
    throw new HttpError(404, "This book could not be found.");
  }

  const existing = await borrows.findOne({ bookId, userEmail: user.email });
  if (existing) {
    throw new HttpError(409, "You already have this book. Return it before borrowing again.");
  }

  if (book.availableCopies <= 0) {
    throw new HttpError(409, "No copies are available right now.");
  }

  // The conditional update makes the decrement atomic: two readers racing for
  // the last copy cannot both succeed.
  const updated = await books.findOneAndUpdate(
    { _id: new ObjectId(bookId), availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { returnDocument: "after" },
  );

  if (!updated) {
    throw new HttpError(409, "No copies are available right now.");
  }

  const doc: BorrowDoc = {
    bookId,
    bookTitle: book.title,
    bookImage: book.image,
    userName: user.name,
    userEmail: user.email,
    borrowDate: now,
    returnDate,
  };

  try {
    const result = await borrows.insertOne(doc);
    res.status(201).json({
      message: `Enjoy "${book.title}". It is yours until ${returnDate.toDateString()}.`,
      borrow: serializeBorrow({ ...doc, _id: result.insertedId }),
    });
  } catch (error) {
    // Roll the copy back if the insert lost a race (duplicate borrow).
    await books.updateOne({ _id: new ObjectId(bookId) }, { $inc: { availableCopies: 1 } });

    if (error instanceof Error && "code" in error && (error as { code?: number }).code === 11000) {
      throw new HttpError(409, "You already have this book. Return it before borrowing again.");
    }

    throw error;
  }
});

/** GET /borrows — only the signed-in reader's active borrows. */
borrowsRouter.get("/", requireAuth, async (req, res) => {
  const user = getAuthUser(req);
  const borrows = await getBorrows();
  const books = await getBooks();

  const docs = await borrows.find({ userEmail: user.email }).sort({ borrowDate: -1 }).toArray();
  const bookIds = [...new Set(docs.map((doc) => doc.bookId))]
    .filter(isObjectId)
    .map(toObjectId);

  const shelf = bookIds.length
    ? await books.find({ _id: { $in: bookIds } }).toArray()
    : [];
  const shelfById = new Map(shelf.map((book) => [book._id.toString(), book]));

  res.json({
    borrows: docs.map((doc) => {
      const book = shelfById.get(doc.bookId);
      return {
        ...serializeBorrow(doc),
        availableCopies: book?.availableCopies ?? 0,
        totalCopies: book?.totalCopies ?? 0,
        bookExists: Boolean(book),
      };
    }),
  });
});

/** DELETE /borrows/:id — return a book and put the copy back on the shelf. */
borrowsRouter.delete("/:id", requireAuth, async (req, res) => {
  if (!isObjectId(routeParam(req.params.id))) {
    throw new HttpError(400, "That borrow id is not valid.");
  }

  const user = getAuthUser(req);
  const borrows = await getBorrows();
  const books = await getBooks();

  const deleted = await borrows.findOneAndDelete({
    _id: new ObjectId(routeParam(req.params.id)),
    userEmail: user.email,
  });

  if (!deleted) {
    throw new HttpError(404, "This borrow could not be found.");
  }

  if (isObjectId(deleted.bookId)) {
    await books.updateOne({ _id: toObjectId(deleted.bookId) }, { $inc: { availableCopies: 1 } });
  }

  res.json({
    message: `"${deleted.bookTitle}" is back on the shelf. Thanks for returning it!`,
    id: req.params.id,
  });
});
