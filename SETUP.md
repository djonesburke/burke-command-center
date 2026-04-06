# Burke CEO Command Center — Setup Guide

## Where We Are Right Now

✅ GitHub repo live: `https://github.com/djonesburke/burke-command-center`
✅ All 53 app files pushed (Next.js 15, Prisma, NextAuth, Claude AI)
✅ Pre-generated secrets (see Section 4)

**Next step: Connect to Railway → set env vars → deploy.**

---

## Step 1 — Connect Railway to GitHub

1. Go to [railway.app](https://railway.app) → log in with `djones@burketruck.com`
2. Click **New Project**
3. Choose **Deploy from GitHub repo**
4. Find and select **`djonesburke/burke-command-center`**
5. Railway creates a service — it will try to build (may fail until env vars are set — that's fine)

---

## Step 2 — Add PostgreSQL Database

1. Inside your Railway project, click **+ New** (top right)
2. Choose **Database → PostgreSQL**
3. Railway automatically creates `DATABASE_URL` and links it to your app service
4. Confirm by going to your app service → **Variables** → you should see `DATABASE_URL` already there

---

## Step 3 — Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project → name it **"Burke CEO Dashboard"**
3. Left menu → **APIs & Services → OAuth consent screen**
   - User type: **Internal** (limits login to your Google Workspace only)
   - App name: `Burke CEO Command Center`
   - User support email: `djones@burketruck.com`
   - Click **Save and Continue** through all steps
4. Left menu → **APIs & Services → Credentials → + Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `Burke CEO Dashboard`
   - Authorized redirect URIs → **+ Add URI**:
     ```
     https://YOUR-APP.up.railway.app/api/auth/callback/google
     ```
     *(replace `YOUR-APP` with your actual Railway domain — find it in Railway under your service → Settings → Domains)*
5. Click **Create** → copy the **Client ID** and **Client Secret**

---

## Step 4 — Set Environment Variables in Railway

Go to your Railway app service → **Variables** tab → add each of these:

| Variable | Value |
|---|---|
| `NEXTAUTH_URL` | `https://YOUR-APP.up.railway.app` |
| `NEXTAUTH_SECRET` | `cc8e7329fdf1cc79db5823348153aa517eb4969ab467da85e965478ced7428b5` |
| `GOOGLE_CLIENT_ID` | *(from Step 3)* |
| `GOOGLE_CLIENT_SECRET` | *(from Step 3)* |
| `ANTHROPIC_API_KEY` | *(your key from console.anthropic.com)* |
| `WEBHOOK_API_KEY` | `mXnT6ZzzPVoQXAbTHYSNX58fExE7EAkF` |
| `CEO_EMAIL` | `djones@burketruck.com` |
| `CEO_INITIAL_PASSWORD` | *(choose a strong password — you'll use this as fallback login)* |

> `DATABASE_URL` is already set automatically from Step 2.

After adding all variables, Railway will auto-redeploy. The `railway.toml` runs:
```
npm run db:migrate && npm run build
```
...then starts the app with `npm start`.

---

## Step 5 — Seed Your Existing Data

After the first successful deploy:

1. Railway → your app service → **Settings → Shell** (or click the ▶ terminal icon)
2. Run:
   ```bash
   npx ts-node --skip-project scripts/seed.ts
   ```
   This creates your CEO user account and migrates your existing tasks from `data/tasks.json`.

---

## Step 6 — First Login

1. Go to your Railway app URL
2. Click **Sign in with Google** → use `djones@burketruck.com`
3. Or use email/password: `djones@burketruck.com` + the `CEO_INITIAL_PASSWORD` you set

---

## Step 7 — Browser Bookmarklet (Create Tasks from Any Page)

1. Open `public/bookmarklet.js` — replace:
   - `YOUR_DOMAIN` → your Railway URL (e.g. `burke-command-center-production.up.railway.app`)
   - `YOUR_WEBHOOK_KEY` → `mXnT6ZzzPVoQXAbTHYSNX58fExE7EAkF`
2. Copy the entire `javascript:(function(){...})();` line
3. Create a new browser bookmark → paste that as the URL
4. To use: highlight text on any page → click the bookmark → a task is created in your dashboard

---

## Step 8 — Claude Integration

To let Claude (in chat) create tasks directly, add this to your Claude Project instructions:

```
When I ask you to create a task, call:
POST https://YOUR-APP.up.railway.app/api/webhook
Headers: { "x-api-key": "mXnT6ZzzPVoQXAbTHYSNX58fExE7EAkF", "Content-Type": "application/json" }
Body: { "type": "task", "title": "...", "priority": "p1|p2|p3", "description": "...", "source": "claude" }

For improvements: set "type": "improvement" and add "category": "product|process|workflow|technology"
```

---

## Local Development (Optional)

```bash
cp .env.example .env
# Fill in values — use http://localhost:4000 for NEXTAUTH_URL

npm install
npm run db:push      # push schema to DB
npm run db:seed      # seed data
npm run dev          # starts at http://localhost:4000
```

---

## Team Onboarding (Phase 2)

When ready to roll out to the team:
1. Team members sign in with their `@burketruck.com` Google accounts (auto-approved since OAuth is Internal)
2. Update their `User.role` in the database for department-level access
3. Departments: `accounting_hr`, `purchasing`, `operations`, `sales`, `engineering`

---

## Odoo Integration (Phase 3)

When ready to connect Odoo 19:
1. Enable JSON-RPC API in Odoo Settings
2. Create API user with read/write access
3. Add to Railway vars: `ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_PASSWORD`
4. The `odooRef` and `odooModel` fields are already in the DB schema, waiting

---

## Backup Strategy

- Railway PostgreSQL includes automated daily backups (retained 7 days on Hobby plan)
- For additional safety, export weekly via Railway shell: `pg_dump $DATABASE_URL > backup.sql`

---

## Restore Point

Git tag `restore-point-v1` on commit `7934436` preserves the state before Railway deployment.
To restore: `git checkout restore-point-v1`

---

*Burke Truck & Equipment Inc. — CEO Operations Platform*
