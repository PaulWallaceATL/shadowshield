# ShadowAI Shield

Next.js application with NextAuth, Prisma, and PostgreSQL.

## Stack

- Next.js (App Router)
- NextAuth (credentials provider, Prisma adapter)
- Prisma ORM
- PostgreSQL (recommended hosted on Supabase)

## Required Environment Variables

Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
```

Required:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `ENCRYPTION_KEY`

Optional (based on provider usage):

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`

Notes:

- Using Supabase with Prisma only requires `DATABASE_URL` (Supabase Postgres).  
- Supabase anon/service-role keys are not required unless you add the Supabase JS SDK.

## Local Development

Install dependencies:

```bash
npm install
```

Run Prisma migrations:

```bash
npx prisma migrate deploy
```

Seed data (optional):

```bash
npm run prisma:seed
```

Start development server:

```bash
npm run dev
```

## Deploying to Vercel

1. Create a Vercel project from this repository.
2. Add all required environment variables in Vercel Project Settings.
3. Set `NEXTAUTH_URL` to your production domain.
4. Use a fresh `NEXTAUTH_SECRET` and `ENCRYPTION_KEY` per environment.
5. Ensure `DATABASE_URL` points to your Supabase production database.

For end-to-end Supabase bootstrap (migrations + seeded admins), see `SUPABASE_SETUP.md`.

## Security Checklist

- Rotate all previously used provider/API keys.
- Do not commit `.env` files.
- Keep `.env.example` as the source of required variable names only.
