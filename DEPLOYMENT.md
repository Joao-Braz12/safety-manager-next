# Deployment — Vercel (app) + Railway (MySQL)

This app is a Next.js 15 (App Router) project using Prisma against MySQL. Production runs the
app on **Vercel** and the database on **Railway**.

## 1. Provision the database on Railway

1. Create a new Railway project → **Add a service → Database → MySQL**.
2. Open the MySQL service → **Variables / Connect** and copy the connection string. It looks like:
   ```
   mysql://root:PASSWORD@HOST:PORT/railway
   ```
3. You'll use this as `DATABASE_URL` in both your local `.env` (for the one-time migrate) and in
   Vercel.

## 2. Apply the schema (migrations)

A baseline migration lives in `prisma/migrations/0_init`. Apply it to the **fresh** Railway DB:

```bash
# From safety-manager-next/, with DATABASE_URL pointed at Railway:
DATABASE_URL="mysql://root:...@host:port/railway" npx prisma migrate deploy
```

Optionally seed demo data (creates the admin/worker logins from `prisma/seed.ts`):

```bash
DATABASE_URL="mysql://root:...@host:port/railway" npm run db:seed
```

> **Baselining an existing DB:** if a database already has the tables (e.g. one created earlier with
> `prisma db push`), don't run `migrate deploy` blind — mark the baseline as already applied instead:
> `npx prisma migrate resolve --applied 0_init`, then future migrations deploy normally.

On every future schema change: create the migration locally with `npx prisma migrate dev --name xxx`,
commit it, then run `npx prisma migrate deploy` against Railway (or wire it into CI — see step 4).

## 3. Deploy the app on Vercel

1. Import the Git repo into Vercel. Set the **Root Directory** to `safety-manager-next/`.
   Framework preset autodetects **Next.js**.
2. Add **Environment Variables** (Production + Preview):
   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | the Railway connection string |
   | `JWT_SECRET` | a long random hex string (do **not** reuse the dev value) |
   | `JWT_EXPIRATION_MS` | `86400000` |
   | `CORS_ORIGIN` | your deployed origin, e.g. `https://your-app.vercel.app` (not `*`) |
3. Deploy. `npm install` runs `postinstall → prisma generate` (so the Prisma Client is built on
   Vercel's cached installs), then `next build`.

## 4. Running migrations on deploy (optional but recommended)

`migrate deploy` needs the DB at deploy time. Two options:

- **Manual (simplest):** run `npx prisma migrate deploy` from your machine against Railway whenever you
  ship a schema change (as in step 2).
- **CI step:** add a GitHub Action (or Vercel "Build Command" override) that runs
  `prisma migrate deploy && next build`. Keep `DATABASE_URL` available to that step. Avoid putting
  `migrate deploy` in `postinstall` (it runs on every install, including Preview builds).

## 5. Production checklist

- [ ] `JWT_SECRET` is a fresh secret stored only in Vercel env (never committed).
- [ ] `CORS_ORIGIN` set to the real domain.
- [ ] `prisma/migrations/` committed; `migrate deploy` applied to Railway.
- [ ] `npm run build` passes locally.
- [ ] The singleton Prisma client in `src/lib/prisma.ts` is used everywhere (it is) to avoid
      exhausting Railway connections from serverless functions.

> The local `docker-compose.yml` (MariaDB) is for **local development only** and is not used in
> production.
