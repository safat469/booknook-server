import type { BookDoc } from "./types";

/**
 * Starter shelf. Covers come from Open Library's ISBN service so the site has
 * real, consistent artwork without bundling image files.
 */
const cover = (isbn: string) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

const curator = {
  id: "booknook-curator",
  name: "The BookNook Curator",
  email: "curator@booknook.app",
};

type SeedBook = Omit<BookDoc, "createdAt"> & { daysAgo: number };

const seeds: SeedBook[] = [
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    category: "Fiction",
    image: cover("9781786892737"),
    description:
      "Between life and death there is a library, and every book on its shelves is a life Nora Seed might have lived. A warm, clever story about regret, small choices and the quiet courage of staying.",
    totalCopies: 4,
    availableCopies: 4,
    addedBy: curator,
    daysAgo: 0,
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    category: "Others",
    image: cover("9780735211292"),
    description:
      "A practical guide to building good habits and breaking bad ones, built around tiny changes that compound. Clear explains the four laws of behaviour change with stories you can actually use.",
    totalCopies: 6,
    availableCopies: 6,
    addedBy: curator,
    daysAgo: 1,
  },
  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    category: "History",
    image: cover("9780062316097"),
    description:
      "A sweeping history of humankind, from foraging bands to global empires. Harari argues that shared stories — money, nations, religion — are what let strangers cooperate at scale.",
    totalCopies: 3,
    availableCopies: 3,
    addedBy: curator,
    daysAgo: 2,
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    category: "Science",
    image: cover("9780593135204"),
    description:
      "A lone astronaut wakes up light-years from Earth with no memory of his mission and one job: save the sun. Science, humour and an unforgettable first-contact friendship follow.",
    totalCopies: 5,
    availableCopies: 5,
    addedBy: curator,
    daysAgo: 3,
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    category: "Fiction",
    image: cover("9781250301697"),
    description:
      "A painter stops speaking after shooting her husband, and a psychotherapist becomes obsessed with making her talk. A tight psychological mystery with a genuinely surprising turn.",
    totalCopies: 2,
    availableCopies: 2,
    addedBy: curator,
    daysAgo: 4,
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    category: "Science",
    image: cover("9780553380163"),
    description:
      "Hawking's classic tour of the universe: black holes, the arrow of time and the search for a theory of everything, written for readers who have never opened a physics textbook.",
    totalCopies: 3,
    availableCopies: 3,
    addedBy: curator,
    daysAgo: 5,
  },
  {
    title: "The Book Thief",
    author: "Markus Zusak",
    category: "History",
    image: cover("9780375842207"),
    description:
      "Death narrates the story of Liesel Meminger, a girl in Nazi Germany who steals books and shares them with her neighbours. A story about words, loss and stubborn kindness.",
    totalCopies: 4,
    availableCopies: 4,
    addedBy: curator,
    daysAgo: 6,
  },
  {
    title: "Harry Potter and the Philosopher's Stone",
    author: "J. K. Rowling",
    category: "Kids",
    image: cover("9780747532699"),
    description:
      "An ordinary boy discovers he is a wizard and leaves for Hogwarts, where friendship, quidditch and a hidden stone await. The beginning of a generation's favourite series.",
    totalCopies: 7,
    availableCopies: 7,
    addedBy: curator,
    daysAgo: 7,
  },
  {
    title: "Educated",
    author: "Tara Westover",
    category: "Others",
    image: cover("9780399590504"),
    description:
      "A memoir of growing up in an isolated survivalist family and teaching yourself enough to reach Cambridge. A clear-eyed look at family loyalty and the cost of an education.",
    totalCopies: 2,
    availableCopies: 2,
    addedBy: curator,
    daysAgo: 8,
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    category: "Fiction",
    image: cover("9780141439518"),
    description:
      "Elizabeth Bennet and Mr Darcy misjudge each other beautifully. Austen's sharpest comedy about class, money and the slow work of changing your mind.",
    totalCopies: 5,
    availableCopies: 5,
    addedBy: curator,
    daysAgo: 9,
  },
  {
    title: "The Very Hungry Caterpillar",
    author: "Eric Carle",
    category: "Kids",
    image: cover("9780399226908"),
    description:
      "A tiny caterpillar eats through the week and becomes a butterfly. Simple cut-out art, counting practice and a very satisfying ending for the youngest readers.",
    totalCopies: 6,
    availableCopies: 6,
    addedBy: curator,
    daysAgo: 10,
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    category: "Science",
    image: cover("9780441172719"),
    description:
      "On a desert planet that produces the most valuable substance in the universe, a young heir is drawn into politics, prophecy and survival. The blueprint for modern science fiction.",
    totalCopies: 3,
    availableCopies: 3,
    addedBy: curator,
    daysAgo: 11,
  },
];

const DAY = 24 * 60 * 60 * 1000;

export function seedBooks(): BookDoc[] {
  const now = Date.now();

  return seeds.map(({ daysAgo, ...book }) => ({
    ...book,
    createdAt: new Date(now - daysAgo * DAY),
  }));
}
