# 🦊 FollowUpFox

**Dead-simple follow-up reminders for solo operators and freelancers.**

Stop losing clients because you forgot to follow up. Add a contact, set a date, get a daily 9am email with exactly who to contact today. Nothing else.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Backend / DB | Supabase (Postgres + Auth + Edge Functions) |
| Email | Resend API |
| Hosting | Vercel / Netlify (frontend) + Supabase Edge (functions) |

---

## Quick Start

```bash
cd followupfox
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project
npm install
npm run dev
```

---

## Supabase Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New project.

### 2. Run the schema SQL

In the Supabase SQL editor, run:

```sql
CREATE TABLE contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  company text,
  email text,
  notes text,
  follow_up_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own contacts"
  ON contacts FOR ALL
  USING (auth.uid() = user_id);

-- Optional: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 3. Enable Email Auth (magic links)

Supabase Dashboard → Authentication → Providers → Email → Enable "Magic Links"

### 4. Copy your project URL & anon key

Settings → API → copy `Project URL` and `anon public` key into `.env`.

---

## Daily Digest Edge Function

### Deploy

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy daily-digest
```

### Set secrets

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
```

### Schedule at 9am UTC

In Supabase Dashboard → Edge Functions → `daily-digest` → Schedule:

```
0 9 * * *
```

Or use Supabase's pg_cron extension:

```sql
SELECT cron.schedule(
  'daily-digest',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-digest',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  )
  $$
);
```

---

## Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Add & verify your sending domain (e.g. `followupfox.com`)
3. Create an API key
4. Set `RESEND_API_KEY` as a Supabase Edge Function secret
5. Update `FROM_EMAIL` in `supabase/functions/daily-digest/index.ts`

---

## File Structure

```
followupfox/
├── index.html                    # App entry point
├── landing.html                  # Standalone landing page
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example                  # Copy to .env
├── src/
│   ├── main.jsx                  # React root
│   ├── App.jsx                   # Auth + Dashboard
│   ├── index.css                 # Tailwind + animations
│   ├── components/
│   │   ├── ContactCard.jsx       # Individual contact with snooze
│   │   ├── AddContactModal.jsx   # Add/edit contact form
│   │   ├── TodaysList.jsx        # Highlighted today's follow-ups
│   │   └── EmptyState.jsx        # First-run empty state
│   └── lib/
│       └── supabase.js           # Supabase client
├── supabase/
│   └── functions/
│       └── daily-digest/
│           └── index.ts          # Edge function (Deno)
└── public/
    └── favicon.svg               # Fox emoji favicon
```

---

## Features

- **Magic link auth** — No passwords. Email to sign in.
- **Today's list** — Overdue + due today, highlighted at top in orange
- **Add contact** — Name, company, email, notes, follow-up date
- **Contact cards** — Days until/since follow-up, red if overdue
- **Snooze** — 3 days / 1 week / 2 weeks / custom date
- **Daily digest email** — 9am, Resend, grouped by overdue + today

---

## Deployment

### Frontend (Vercel)

```bash
# From followupfox/
vercel deploy
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel env vars
```

### Frontend (Netlify)

```bash
netlify deploy --build
# Build command: npm run build
# Publish dir: dist
```

---

## Pricing Model

| Plan | Price | Contacts |
|---|---|---|
| Free | $0/mo | 10 contacts |
| Pro | $7/mo | Unlimited |

Stripe integration: Add `plan` field to a `profiles` table, check it server-side in the Edge Function or via RLS.

---

## What Needs Manual Setup

1. ✅ Frontend code — done
2. ⚙️ **Supabase project** — create at supabase.com, run schema SQL
3. ⚙️ **Resend account** — create at resend.com, verify domain
4. ⚙️ **Edge Function secrets** — `RESEND_API_KEY` via Supabase CLI
5. ⚙️ **Cron schedule** — configure 9am UTC in Supabase dashboard
6. ⚙️ **Custom domain** — point `followupfox.com` to your frontend host
7. ⚙️ **Stripe** (optional) — for paid plan enforcement

---

## License

MIT
