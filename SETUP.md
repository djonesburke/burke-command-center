# Burke CEO Command Center — Setup Guide

## One-Time Setup (~30 minutes)

### 1. Accounts to Create

| Service | URL | Purpose | Cost |
|---|---|---|---|
| Railway | railway.app | Hosting + PostgreSQL database | ~$20-30/mo |
| Google Cloud Console | console.cloud.google.com | Google SSO OAuth credentials | Free |
| GitHub | github.com/djonesburke | Code repository (already exists) | Free |
| Anthropic | console.anthropic.com | Claude AI API (already have key) | Pay per use |

---

### 2. Railway Setup

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. **New Project** → **Deploy from GitHub repo** → select `djonesburke/CEO-COMMAND-CENTER`
3. Add a **PostgreSQL** database service to the same project
4. Railway will auto-link `DATABASE_URL` to your app
5. Go to your app service → **Variables** → add all vars from `.env.example`

---

### 3. Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project: "Burke CEO Dashboard"
3. **APIs & Services → OAuth consent screen**:
   - User type: Internal (your Workspace only)
   - App name: Burke CEO Command Center
   - Authorized domain: your Railway domain
4. **APIs & Services → Credentials → Create OAuth 2.0 Client ID**:
   - Type: Web application
   - Authorized redirect URI: `https://YOUR_DOMAIN.railway.app/api/auth/callback/google`
5. Copy **Client ID** and **Client Secret** → paste into Railway variables

---

### 4. Environment Variables (Railway)

```
DATABASE_URL         ← auto-set by Railway PostgreSQL
NEXTAUTH_URL         = https://YOUR_DOMAIN.railway.app
NEXTAUTH_SECRET      = (run: openssl rand -base64 32)
GOOGLE_CLIENT_ID     = (from Google Cloud Console)
GOOGLE_CLIENT_SECRET = (from Google Cloud Console)
ANTHROPIC_API_KEY    = (your existing key)
WEBHOOK_API_KEY      = (run: openssl rand -hex 32)
CEO_EMAIL            = dalton@burketruck.com
CEO_INITIAL_PASSWORD = (set a strong password)
```

---

### 5. First Deploy

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run db:generate

# 3. Push to GitHub (Railway auto-deploys)
git add .
git commit -m "Initial Next.js CEO dashboard"
git push origin main

# Railway will auto-build and deploy.
# After deploy, run the seed to migrate your existing data:

# 4. In Railway → your app service → Shell:
npm run db:seed
```

---

### 6. Browser Bookmarklet (Create Tasks from Any Page)

1. Open `public/bookmarklet.js`
2. Replace `YOUR_DOMAIN` with your Railway URL
3. Replace `YOUR_WEBHOOK_KEY` with your `WEBHOOK_API_KEY` value
4. Copy the `javascript:(function(){...})();` line
5. Create a new browser bookmark → paste as the URL
6. Click it on any webpage to send a task to your dashboard

**How Claude uses this API:**
When talking to Claude (chat, Cowork, email analysis), you can say:
> "Create a task from this email — title: Follow up with Dane County, priority P1"

Claude will call: `POST https://YOUR_DOMAIN.railway.app/api/webhook`
with header `x-api-key: YOUR_WEBHOOK_KEY`

---

### 7. Claude Integration Setup

To allow Claude to create tasks directly, give it these instructions in your system prompt / Claude project:

```
When I ask you to create a task, call:
POST https://YOUR_DOMAIN.railway.app/api/webhook
Headers: { "x-api-key": "YOUR_WEBHOOK_KEY", "Content-Type": "application/json" }
Body: { "type": "task", "title": "...", "priority": "p1|p2|p3", "description": "...", "source": "claude" }

For improvements: set "type": "improvement" and add "category": "product|process|workflow|technology"
```

---

### 8. Backup Strategy (Auto-configured)

- **Railway**: Daily automated backups enabled in your PostgreSQL service
- **Google Drive backup**: Set up a weekly GitHub Action to export DB → Drive

To enable weekly Drive export, add these GitHub secrets:
- `DATABASE_URL` (your Railway DB URL)
- `GOOGLE_DRIVE_FOLDER_ID` (target folder in Drive)

---

### 9. Local Development

```bash
# 1. Copy env file
cp .env.example .env
# Fill in your values (use localhost for NEXTAUTH_URL)

# 2. Start local DB (optional — or use Railway DB directly)
# Or just point DATABASE_URL at Railway DB for dev

# 3. Run migrations
npm run db:push

# 4. Seed data
npm run db:seed

# 5. Start dev server
npm run dev
# → http://localhost:3000
```

---

## Team Onboarding (Phase 2)

When you're ready to roll out to the team:

1. In Railway → Variables → Add user emails
2. Update `User.role` in database for each team member
3. Team members sign in with their Burke Truck Google accounts
4. Each department sees tasks relevant to their role

**Departments planned:**
- `accounting_hr` — Finance, HR tasks
- `purchasing` — Purchasing, Inventory tasks
- `operations` — Shop floor, Manufacturing
- `sales` — Customer/quoting tasks
- `engineering` — SolidWorks, BOM, CAM tasks

---

## Odoo Integration (Phase 3)

When ready to connect Odoo 19:

1. Enable JSON-RPC API in Odoo Settings
2. Create API user with read/write access
3. Add `ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_PASSWORD` to Railway vars
4. The `odooRef` and `odooModel` fields are already in the database schema, waiting

---

*Burke Truck & Equipment Inc. — CEO Operations Platform*
