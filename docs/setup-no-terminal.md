# Setting up ReLaax without a terminal

Three web accounts, about 30 minutes. Do them in this order.

## 1. GitHub (where the code lives)

1. Sign up at github.com. Click **New repository**, name it `relaax`, leave it **Private**, click **Create**.
2. On the empty repo page click **uploading an existing file**. Open the unzipped `relaax` folder on your computer, select everything inside it, and drag it into the browser. Click **Commit changes**. (If the browser balks at the number of files, install GitHub Desktop, choose *Add local repository*, point it at the folder, and click *Publish*.)
3. Tell Claude the repo name. From here, changes Claude makes land in the repo and deploy on their own.

## 2. Railway (runs the backend and databases)

1. Sign up at railway.app with **Login with GitHub**.
2. **New Project → Deploy from GitHub repo → relaax**. Railway reads `railway.json` and builds the API.
3. In the project canvas click **+ New → Database → PostgreSQL**. Do it **twice** (one is `core`, one is the health vault). Then **+ New → Database → Redis**.
4. Click the **relaax** service → **Variables** tab → **Raw editor**, paste:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   HEALTH_DATABASE_URL=${{Postgres-2.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   ANTHROPIC_API_KEY=sk-ant-...        (from console.anthropic.com → API keys)
   NODE_ENV=production
   ```
   Match `Postgres` / `Postgres-2` to whatever Railway named your two databases.
5. **Settings → Networking → Generate Domain**. Copy the URL, e.g. `relaax-api-production.up.railway.app`. Open `https://<that url>/health` in a browser: `{"ok":true}` means it is live.
6. Nothing else: every deploy runs the database migrations and the (idempotent) seed before the API starts.

Optional later: `GOOGLE_PLACES_API_KEY` (Eat Out), `CLERK_SECRET_KEY` (real sign-in), `STRIPE_SECRET_KEY`.

## 3. Expo EAS (builds the phone app)

1. Sign up at expo.dev with GitHub. **Create a project** named `relaax`; copy its **Project ID**.
2. In GitHub, open `apps/mobile/app.config.ts` and click the pencil icon. Replace `projectId: ""` with your id. (`apps/mobile/eas.json` already points at the Railway domain.) Commit.
3. On expo.dev → project → **GitHub** tab, connect the `relaax` repo. The workflow in `.eas/workflows/preview.yml` builds iOS and Android previews on every push to `main`.
4. When the build finishes (10 to 20 minutes), EAS emails an install link. On iPhone it installs as an internal build; Expo walks you through registering your phone the first time (needs an Apple Developer account, $99/yr). On Android the link installs directly.

## Day-to-day

- Something to change: ask Claude. The change lands in GitHub, Railway redeploys in about 3 minutes, EAS rebuilds the app in about 15.
- See data: Railway → Postgres → **Data** tab.
- See what the AI did: Railway → relaax service → **Logs** (every model call is logged with model, prompt version and token counts).
