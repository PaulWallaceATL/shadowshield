# Supabase + Prisma Production Setup

This project uses Prisma as the schema/source of truth and Supabase as the hosted PostgreSQL database.

## 1) Create Supabase project

- Create a new Supabase project.
- In Supabase, open **Project Settings → Database** and open the **Connection string** tab.

## 2) Configure environment variables

Set these in Vercel (Preview + Production):

- **`DATABASE_URL`** — **On Vercel you must use the Transaction pooler** (direct connection is not reachable from Vercel’s network). In Supabase: **Project Settings → Database → Connection string** → choose **Transaction pooler** → copy the **URI**. Replace `[YOUR-PASSWORD]` with your DB password (URL-encode: `$` → `%24`, `!` → `%21`). Use that string exactly (it includes the correct region, e.g. `aws-0-us-east-1.pooler.supabase.com:6543`).
- **`DIRECT_URL`** — Use the **Direct connection** URI from the same page (Method: Direct connection). Required for Prisma migrations; not used at runtime on Vercel.
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `ENCRYPTION_KEY`
- `ANTHROPIC_API_KEY` (optional by provider usage)
- `OPENAI_API_KEY` (optional by provider usage)
- `GOOGLE_API_KEY` (optional by provider usage)
- `SEED_SUPERADMIN_EMAIL`
- `SEED_SUPERADMIN_NAME`
- `SEED_SUPERADMIN_PASSWORD`
- `SEED_SUPERADMIN_DEPARTMENT`
- `SEED_ADMIN_EMAIL` (optional)
- `SEED_ADMIN_NAME` (optional)
- `SEED_ADMIN_PASSWORD` (optional)
- `SEED_ADMIN_DEPARTMENT` (optional)

## 3) Apply schema (Prisma migrations)

Prisma migrations in `prisma/migrations` are the Supabase schema bootstrap.

From a machine with DB access and env vars configured:

```bash
npx prisma migrate deploy
```

This creates the database schema for users, sessions, chats, queries, alerts, DLP rules, API keys, and settings.

## 4) Seed initial admin accounts + defaults

After migrations:

```bash
npm run prisma:seed
```

Behavior:

- Always creates/updates one `SUPER_ADMIN` user from `SEED_SUPERADMIN_*`.
- Optionally creates/updates one `ADMIN` user when `SEED_ADMIN_PASSWORD` is set.
- Initializes baseline DLP rules and system settings.
- Creates a sample chat/query if not present.

## 5) Deploy to Vercel

- Connect the repository in Vercel.
- Ensure all required variables exist in each environment.
- Deploy.

## Notes

- You do not need Supabase anon/service-role keys unless you add Supabase JS client features.
- Keep Prisma as the long-term data access layer; Supabase is your DB infrastructure layer.

## Troubleshooting

- **"Can't reach database server" from Vercel** — Use the **Transaction pooler** URI for `DATABASE_URL` (see above). Do not use the direct connection URI on Vercel.
- **"Tenant or user not found" with pooler** — Copy the Transaction pooler URI **directly from your Supabase project** (Connection string → Transaction pooler). The region in the host (e.g. `us-east-1`) must match your project; do not guess the region.
