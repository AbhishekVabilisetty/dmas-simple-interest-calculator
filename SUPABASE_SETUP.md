# Supabase Setup

This app now supports two storage modes:

- Local browser storage: works immediately with no backend
- Supabase cloud storage: enabled after you add Supabase environment keys

## 1. Create a Supabase project

Create a new project in Supabase and open the SQL editor.

## 2. Create the `bills` table

Run the SQL in:

- [supabase/schema.sql](C:/Users/vabil/Documents/intrest/supabase/schema.sql)

This creates:

- `public.bills`
- row-level security policies
- automatic `updated_at` handling

## 3. Enable email sign-in

In Supabase Auth:

- enable Email auth
- enable Magic Link or OTP email sign-in

## 4. Add local environment keys

Copy:

- [.env.example](C:/Users/vabil/Documents/intrest/.env.example)

Create a local `.env` or `.env.local` file with:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
```

## 5. Run locally

```powershell
npm install
npm run dev
```

Once the env keys are present, the sidebar will show a `Cloud Backup` section.

## 6. Deploy

Recommended:

- frontend: Vercel
- database/auth: Supabase

Add the same two environment variables in your Vercel project settings.

## 7. Publish safely

This app is designed so each signed-in user can only access their own bills.

Do not expose a Supabase service role key in the frontend.
If you only see the legacy `anon` key in your project, this app also supports that as a fallback.
