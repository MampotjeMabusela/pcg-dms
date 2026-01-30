# Step-by-Step: Deploy Backend on Fly.io & Frontend on Vercel

## Prerequisites

- GitHub account
- [Fly.io](https://fly.io) account (sign up at https://fly.io/app/sign-up)
- [Vercel](https://vercel.com) account (sign up with GitHub)
- Your project pushed to a GitHub repository
- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed on your machine

---

# Part 1: Deploy Backend on Fly.io (do this first)

You need the backend URL before configuring the frontend.

**Already done for you:** Fly app `dms-backend` was created and deployed. Backend URL: **https://dms-backend.fly.dev**. Secrets `SECRET_KEY` and `DATABASE_URL` are set; `CORS_ORIGINS` is set to `http://localhost:5173`. After you deploy the frontend on Vercel, run: `fly secrets set CORS_ORIGINS="https://your-vercel-url.vercel.app,http://localhost:5173"` (from the `backend` folder).

## Step 1: Install Fly CLI (if you haven’t)

**Windows (PowerShell):**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**macOS:**
```bash
brew install flyctl
```

**Or:** Download from https://fly.io/docs/hands-on/install-flyctl/

Then log in:
```bash
fly auth login
```
(Opens browser to sign in.)

---

## Step 2: Create a Fly app for the backend (from your project)

1. Open a terminal and go to the **backend** folder of your project.
   From your **project root** (e.g. `dms-project`), run:
   ```bash
   cd backend
   ```
   On Windows, if you're already in `C:\Users\...\dms-project`, that same command works: `cd backend`.
2. Launch a new Fly app (uses the existing `Dockerfile` and `fly.toml` in `backend/`):
   ```bash
   fly launch
   ```
3. When prompted:
   - **App name:** Accept the suggested name (e.g. `dms-backend`) or choose another (must be unique on Fly.io).
   - **Region:** Pick one close to you (e.g. `ams` for Amsterdam, `iad` for Virginia).
   - **PostgreSQL:** Choose **No** for now (you can add Fly Postgres later; we’ll use SQLite first).
   - **Redis:** Choose **No**.
   - **Deploy now:** Choose **No** so you can set secrets first.

---

## Step 3: Set secrets (environment variables) on Fly.io

Fly uses **secrets** for sensitive env vars. Set them before the first deploy.

1. Generate a strong `SECRET_KEY` (e.g. run once):
   ```bash
   # PowerShell (Windows)
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
   ```
   Or use any long random string (e.g. 32+ characters).

2. From the **backend** folder, set secrets:
   ```bash
   fly secrets set SECRET_KEY="your-long-random-secret-key-here"
   fly secrets set DATABASE_URL="sqlite:///./dms.db"
   ```
   (For SQLite, the app will write to local disk; for persistence across deploys, add a volume—see Step 3b.)

3. **After** you deploy the frontend on Vercel (Part 2), set CORS to your Vercel URL:
   ```bash
   fly secrets set CORS_ORIGINS="https://your-app.vercel.app,http://localhost:5173"
   ```
   Replace `your-app.vercel.app` with your actual Vercel URL.

**Optional:** For OpenAI-powered features:
```bash
fly secrets set OPENAI_API_KEY="your-openai-api-key"
```

---

## Step 3b (Optional): Persist SQLite and uploads with a volume

If you use SQLite and want the database and uploads to persist across deploys:

1. Create a volume:
   ```bash
   fly volumes create dms_data --region ams
   ```
   (Use the same region as your app; replace `ams` if needed.)

2. In `backend/fly.toml`, add (before `[[vm]]`):
   ```toml
   [mounts]
     source = "dms_data"
     destination = "/data"
   ```

3. Set env so the app uses `/data`:
   ```bash
   fly secrets set DATABASE_URL="sqlite:////data/dms.db"
   fly secrets set UPLOAD_DIR="/data/uploads"
   ```
   Your app must create `/data/uploads` on startup if it doesn’t exist (or add a small init step in the Dockerfile).

4. If your app reads `UPLOAD_DIR` from config, ensure `config.py` has that (it does). Redeploy:
   ```bash
   fly deploy
   ```

---

## Step 4: Deploy the backend

From the **backend** folder:

```bash
fly deploy
```

Wait until the deploy finishes. Then:

```bash
fly open
```

Or open your app URL from the dashboard: **https://app.fly.io** → your app → **Hostname** (e.g. `https://dms-backend.fly.dev`).

**Copy this URL** — this is your **backend URL** (e.g. `https://dms-backend.fly.dev`).

---

## Step 5: Create an admin user on production (optional)

After the backend is live, create an admin user by running your script against the production app. For example, with a one-off console:

```bash
fly ssh console
# Then inside the machine, if you have create_admin.py and Python:
# python create_admin.py
# Exit with 'exit'
```

Or run `create_admin.py` locally with `DATABASE_URL` pointing at production (only if you use a reachable DB). Your repo has `create_admin.py`; adapt as needed for your setup.

---

# Part 2: Deploy Frontend on Vercel

## Step 1: Import the project on Vercel

1. Go to **https://vercel.com** and log in (e.g. **Continue with GitHub**).
2. Click **Add New…** → **Project**.
3. **Import Git Repository:** Select your GitHub repo (e.g. `dms-project`).
4. Click **Import**.

---

## Step 2: Configure the frontend project

1. **Project Name:** e.g. `dms-project` (or any name).
2. **Root Directory:** Click **Edit** and set to **`frontend`**.
3. **Framework Preset:** **Vite** (usually auto-detected).
   - If not, choose **Other** and set:
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
4. **Environment Variables:** Click **Add**:
   - **Name:** `VITE_API_BASE`
   - **Value:** Your Fly.io backend URL from Part 1 (e.g. `https://dms-backend.fly.dev`)
   - No trailing slash.

---

## Step 3: Deploy

1. Click **Deploy**.
2. Wait until the build finishes and status is **Ready**.
3. Click **Visit** to open the site. The URL will be like **https://dms-project.vercel.app** — this is your **frontend URL**.

---

## Step 4: Allow frontend in backend CORS

1. In a terminal, from the **backend** folder:
   ```bash
   fly secrets set CORS_ORIGINS="https://dms-project.vercel.app,http://localhost:5173"
   ```
   Use your actual Vercel URL. Fly will redeploy the app.
2. After redeploy, the browser should allow requests from your Vercel site to the Fly.io API.

---

# Summary

| What        | Where   | URL example                    |
|------------|--------|---------------------------------|
| Backend    | Fly.io | `https://dms-backend.fly.dev`   |
| Frontend   | Vercel | `https://dms-project.vercel.app`|

**Backend (Fly.io):**  
- Commands run from `backend/`.  
- Env via `fly secrets set` (e.g. `SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`).  
- Optional: volume for SQLite + uploads; optional Fly Postgres.

**Frontend (Vercel):**  
- Root directory: `frontend`.  
- Env: `VITE_API_BASE` = backend URL.

---

# Quick reference: Fly.io commands (from `backend/`)

```bash
fly launch          # First-time setup (use existing Dockerfile + fly.toml)
fly secrets set KEY=value
fly deploy          # Deploy after code or config changes
fly open            # Open app in browser
fly logs            # View logs
fly status          # App status
```

---

# Troubleshooting

- **CORS errors:** Ensure `CORS_ORIGINS` on Fly includes your exact Vercel URL (`https://...`, no trailing slash). Redeploy after changing secrets.
- **Backend 502 / not starting:** Run `fly logs` and fix any startup errors. Ensure the app listens on `PORT` (the Dockerfile uses `${PORT:-8080}`).
- **Frontend “Cannot connect to server”:** Check `VITE_API_BASE` on Vercel is the Fly.io backend URL and redeploy the frontend after changing env.
- **SQLite not persisting:** Add a Fly volume and set `DATABASE_URL` and `UPLOAD_DIR` to paths under the volume (see Step 3b).
- **Need PostgreSQL:** Use `fly postgres create` and then `fly secrets set DATABASE_URL="postgres://..."` with the provided URL.
