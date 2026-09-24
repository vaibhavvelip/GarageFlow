# GarageFlow — Staging Deployment Guide

## 1. Architecture Overview
GarageFlow is a monolithic Node.js + Express application that simultaneously serves:
- **Frontend:** Static HTML, CSS, Vanilla JS, and Bootstrap 5 files from the `/client` directory at `/`.
- **Backend:** REST API endpoints under `/api/*`.
- **Database & Auth:** Cloud-hosted InsForge managed PostgreSQL with Row-Level Security (RLS) and InsForge Auth.

Because the Express server serves both the frontend and API from the same origin, deploying this unified service to a single staging container or PaaS eliminates cross-origin issues and simplifies hosting.

---

## 2. Required Environment Variables for Staging

Configure these environment variables in your staging host dashboard (e.g., Render, Railway, Fly.io):

| Variable Name | Staging Value Example | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production error sanitization and security policies |
| `PORT` | `5000` (or host assigned `$PORT`) | Port on which the Express server listens |
| `JWT_SECRET` | `a8f3b9c1d4e2...` (64-character hex) | Cryptographically secure random key for JWT signing |
| `CORS_ORIGIN` | `https://garageflow-staging.onrender.com` | Exact staging domain (or `*` if testing without custom domain) |
| `INSFORGE_URL` | `https://y5j2m9b9.us-east.insforge.app` | InsForge BaaS endpoint |
| `INSFORGE_ANON_KEY` | `anon_...` | InsForge public anonymous key |
| `INSFORGE_API_KEY` | `ik_...` | InsForge privileged service role key (server-side only) |

> **Secret Generation Command:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 3. Recommended Staging Hosting Options

### Option A: Render (Web Service) — Recommended
1. Create a **New Web Service** connected to the repository.
2. Select **Node** environment:
   - **Build Command:** `npm install` (or `npm ci --only=production`)
   - **Start Command:** `node server/server.js` (or `npm start`)
3. Add the environment variables from Section 2.
4. Render automatically configures SSL/HTTPS at `https://<service-name>.onrender.com`.

### Option B: Railway (Service)
1. Deploy from GitHub repository.
2. Railway detects `package.json` automatically.
3. Configure the environment variables in the **Variables** tab.
4. Generate a public staging domain under **Settings &rarr; Domains**.

### Option C: Docker Container (Fly.io / AWS ECS / Self-Hosted VPS)
1. Build the container:
   ```bash
   docker build -t garageflow:staging .
   ```
2. Run with environment variables:
   ```bash
   docker run -d -p 5000:5000 --env-file .env.staging garageflow:staging
   ```

---

## 4. Staging Verification Protocol (Post-Deployment)

Execute these automated/manual checks immediately after deployment:

1. **Health Probes:**
   - `GET https://<staging-url>/api/health` &rarr; Verify HTTP 200, `database.connected: true`.
   - `GET https://<staging-url>/api/insforge/health` &rarr; Verify HTTP 200, `status: 'online'`, `rlsEnabled: true`.
2. **Frontend UI:**
   - `GET https://<staging-url>/` &rarr; Verify homepage and footer text.
   - `GET https://<staging-url>/login.html` &rarr; Test authentication with demo credentials.
3. **Customer Operations:**
   - Register new test user (`staging.test@example.com`).
   - Add test vehicle, edit mileage, book appointment.
4. **Admin Operations:**
   - Log in as `admin@garageflow.com`.
   - Advance appointment status (`Requested` &rarr; `Confirmed` &rarr; `In Service`).
   - Create service record with atomic stored procedure and verify inventory deduction.
5. **Security Verification:**
   - Test rate limiter: Burst 50+ rapid login attempts to verify HTTP 429 response.
   - Verify unauthenticated requests to `/api/admin/*` receive HTTP 401/403.

---

## 5. Rollback Procedure

If any staging failure occurs:
1. Revert to the last stable release tag in the hosting dashboard (Render / Railway / Git).
2. The database schema is non-destructively versioned via `migrations/`; previous migrations remain valid.
3. SQLite backup artifacts (`backup_garageflow_20260924_010711.sqlite`) are permanently preserved.
