# Arti Blog API

Express API for the Arti Dev Blog. It uses Clerk for authentication, Supabase Postgres for data, and ImageKit for image uploads.

## Quick start

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

The API runs on `http://localhost:3000` by default.

## Environment variables

Set these values in `.env`:

```env
PORT=3000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_replace_me
CLERK_SECRET_KEY=sk_test_replace_me
CLERK_WEBHOOK_SECRET=whsec_replace_me
IK_URL_ENDPOINT=https://ik.imagekit.io/your-imagekit-id
IK_PUBLIC_KEY=public_replace_me
IK_PRIVATE_KEY=private_replace_me
```

## Database

Apply the SQL migration in `supabase/migrations/` to a new Supabase project before starting the API. The server uses the Supabase secret key, while row-level security blocks direct browser access.

## Commands

```bash
npm run dev          # Run locally with file watching
npm test             # Run backend tests
```

## Deployment

On Railway, set `CLIENT_URL` to the deployed frontend origin and configure the Supabase, Clerk, and ImageKit variables above. Configure Clerk's webhook endpoint as `/webhooks/clerk` on this API.