# Furniture Hub

The storefront reads its product catalog and categories from a PostgreSQL
database through the Express API.

## Requirements

- Node.js 18 or newer with npm
- PostgreSQL 14 or newer

## Configure and run

1. Create a PostgreSQL database named `furniture_hub`.
2. In `backend`, copy `.env.example` to `.env` and set your PostgreSQL
   password in `DATABASE_URL`.
3. From the `backend` folder, run:

   ```sh
   npm install
   npm run db:generate
   npm run db:migrate -- --name init
   npm run db:seed
   npm run dev
   ```

4. Open `http://localhost:3000`. The API health check is
   `http://localhost:3000/api/health`.

The browser must use the Express-served page at `http://localhost:3000`,
not open `index.html` directly, so same-origin API requests can reach the
backend. Catalog records are sample seed data; edit `backend/prisma/seed.js`
to change them. Set `WHATSAPP_PHONE` in the backend `.env` to the store's
international number without a leading plus sign. Keep `.env` private and
never commit real credentials.

## Deploy to Vercel

The root `vercel.json` builds the Prisma client, and `api/[...route].js`
exposes the Express API as a Vercel function. Import the project with the
workspace root as the Vercel project root. Add `DATABASE_URL` (use a hosted
PostgreSQL connection string) and `WHATSAPP_PHONE` as Vercel environment
variables; do not commit them.

Before deploying, point `backend/.env` at the hosted database and apply the
Prisma migration and sample catalog from `backend`:

```sh
npm run db:migrate -- --name init
npm run db:seed
```

Deploy with the Vercel CLI (`vercel` for a preview or `vercel --prod` for
production), or connect the project to a Git repository in Vercel. The API
health check is available at `/api/health`.

Customers can create an account or sign in using the Login and Register
controls. Registration requires a first name, last name, email, and password.
Passwords are stored as scrypt hashes, and the backend uses HttpOnly session
cookies. A fresh setup creates the account and session tables with the
`db:migrate` command above. If you already migrated the database before adding
accounts or names, run
`npm run db:migrate -- --name add-account-names` from `backend` to apply the
latest account schema changes.

## API

- `GET /api/health` — verifies the API and PostgreSQL connection.
- `POST /api/auth/register` — creates an account and signs it in.
- `POST /api/auth/login` — signs in with an email and password.
- `GET /api/auth/me` — returns the current account, or `null` when signed out.
- `POST /api/auth/logout` — ends the current session.
- `GET /api/categories` — lists categories containing active products.
- `GET /api/products` — lists active products. Optional query parameters:
  `search` and `category`.
- `GET /api/settings` — returns the public WhatsApp contact configuration.
