# Musaffa Country Knowledge Base

Internal Next.js app for KYC and funding documentation by country. Data is stored in **Neon Postgres**; team members sign in with **Google (@musaffa.com only)** to edit.

## Stack

- Next.js 15, TypeScript, Tailwind CSS v4
- Neon Postgres + Prisma
- Auth.js (NextAuth v5) + Google OAuth

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment** — copy `.env.example` to `.env.local` and fill in:

   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | Neon Postgres connection string |
   | `AUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
   | `AUTH_GOOGLE_ID` | Google OAuth client ID |
   | `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
   | `ADMIN_EMAILS` | Comma-separated @musaffa.com emails that become **Admin** on first sign-in |
   | `AUTH_URL` | `http://localhost:3000` locally |

3. **Database**

   ```bash
   npm run db:setup    # push schema + seed from data/countries.json
   ```

4. **Run**

   ```bash
   npm run dev
   ```

## Google OAuth setup

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create **OAuth 2.0 Client ID** (Web application)
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/callback/google`
4. Copy Client ID and Secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`

## Roles

| Role | Can view | Can edit countries | Can manage users |
|------|----------|-------------------|------------------|
| **Viewer** | Yes | No | No |
| **Editor** | Yes | Yes | No |
| **Admin** | Yes | Yes | Yes |

- Only `@musaffa.com` accounts can sign in.
- Emails listed in `ADMIN_EMAILS` get **Admin** on first login.
- Admins grant **Editor** access at `/admin`.

## Content status

Each country and KB section tracks:

- **AI draft** — imported / generated, not yet verified
- **Verified** — updated by the Musaffa team (set automatically when an editor saves)

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add the same environment variables as `.env.local` (use production `AUTH_URL` = your Vercel URL).
4. Build command: `npm run build` (runs `prisma generate` automatically).
5. After first deploy, run once locally or via Vercel CLI:

   ```bash
   npm run db:setup
   ```

   Or use Neon SQL / a one-off Vercel build hook if you prefer seeding from CI.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:setup` | Push schema + seed countries |
| `npm run db:seed` | Re-seed from `data/countries.json` |
| `npm run build:countries` | Regenerate JSON from Excel (Python) |

## Notes

- **User Overview** stats are read-only placeholders (not editable yet).
- **Fee Calculator** profiles remain in code (`src/lib/fee-profiles/`); country JSON `fees` fields are editable for reference.
- Never commit `.env.local` or database credentials to Git.
