# BookNook API

Express 5 + MongoDB API for the BookNook library app.

## Scripts

```bash
npm install
cp .env.example .env   # add MONGODB_URI + JWT_SECRET
npm run seed           # optional: fill the starter shelf
npm run dev            # tsx watch on http://localhost:5000
npm run build && npm start
```

## Routes

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/books` | public | `limit`, `category`, `q`, `owner=me` |
| GET | `/books/:id` | JWT | returns `borrowedByMe` |
| POST | `/books` | JWT | owner comes from the token |
| PATCH | `/books/:id` | JWT | owner only, adjusts copies safely |
| DELETE | `/books/:id` | JWT | owner only, clears related borrows |
| POST | `/borrows` | JWT | atomic decrement, no double borrow |
| GET | `/borrows` | JWT | current reader's borrows |
| DELETE | `/borrows/:id` | JWT | returns the copy to the shelf |

The same router is mounted at `/` and `/api`, so both documented paths work.

## Auth

The Next.js client exchanges the Better Auth session for a 10-minute JWT at
`/api/auth/token`. Send it as `Authorization: Bearer <token>`. `JWT_SECRET` must
be identical in both apps.

## Deploying

`vercel.json` + `api/index.ts` deploy the API as a Vercel serverless function.
For Render, use `npm install && npm run build` and `npm start`. Set
`CLIENT_ORIGINS` to the deployed client origin.
