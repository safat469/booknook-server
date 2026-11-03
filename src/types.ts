export const CATEGORIES = ["Fiction", "Science", "History", "Kids", "Others"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface BookDoc {
  title: string;
  author: string;
  category: Category;
  image: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  addedBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
}

export interface BorrowDoc {
  bookId: string;
  bookTitle: string;
  bookImage: string;
  userName: string;
  userEmail: string;
  borrowDate: Date;
  returnDate: Date;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}
