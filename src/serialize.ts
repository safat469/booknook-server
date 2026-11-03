import { ObjectId, WithId } from "mongodb";

import type { BookDoc, BorrowDoc } from "./types";

export function isObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}

export function toObjectId(value: string): ObjectId {
  return new ObjectId(value);
}

export function serializeBook(book: WithId<BookDoc>) {
  return {
    id: book._id.toString(),
    title: book.title,
    author: book.author,
    category: book.category,
    image: book.image,
    description: book.description,
    totalCopies: book.totalCopies,
    availableCopies: book.availableCopies,
    addedBy: book.addedBy,
    createdAt: new Date(book.createdAt).toISOString(),
  };
}

export function serializeBorrow(borrow: WithId<BorrowDoc>) {
  return {
    id: borrow._id.toString(),
    bookId: borrow.bookId,
    bookTitle: borrow.bookTitle,
    bookImage: borrow.bookImage,
    userName: borrow.userName,
    userEmail: borrow.userEmail,
    borrowDate: new Date(borrow.borrowDate).toISOString(),
    returnDate: new Date(borrow.returnDate).toISOString(),
  };
}

export type PublicBook = ReturnType<typeof serializeBook>;
export type PublicBorrow = ReturnType<typeof serializeBorrow>;
