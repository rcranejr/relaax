# Running ReLaax on Replit

One workspace runs everything: the API, the two databases, and a web preview of the app. No terminal, no separate hosting accounts.

## 1. Import the project (once)

Pick either:

- **From GitHub (recommended):** on replit.com click **Create Repl → Import from GitHub**, paste `https://github.com/rcranejr/relaax`, click **Import**. Future changes Claude pushes to GitHub can be pulled in from the **Git** tool in the left sidebar.
- **From the zip:** click **Create Repl → Import from… → Upload zip** (or create a blank Repl and drag `relaax-replit.zip` into the Files pane and choose *Extract*).

Replit reads `.replit` from the project and knows how to run it.

## 2. Add the database (once)

In the left sidebar open **Tools → Database** (PostgreSQL) and click **Create a database**. That is all: Replit sets `DATABASE_URL`, and on first run the project creates the second (health) database by itself.

## 3. Add secrets (once, optional for the first preview)

**Tools → Secrets**, add:

| Key | Needed for |
|---|---|
| `ANTHROPIC_API_KEY` | the AI coach (console.anthropic.com → API keys) |
| `GOOGLE_PLACES_API_KEY` | Eat Out restaurant search |
| `CLERK_SECRET_KEY`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | real sign-in |
| `STRIPE_SECRET_KEY` | camp payments |

The app runs without them; the related features show a friendly "not configured" state.

## 4. Press Run

The first run installs dependencies (2–3 minutes). After that:

- The **preview pane** shows the ReLaax app running as a website (same screens as the phone app).
- The API is at `https://<your-repl-domain>:3000` — open `/health` on it and you should see `{"ok":true}`.
- Database rows: **Tools → Database** has a table viewer.

Press Run again any time; migrations and seed data are re-applied safely.

## 5. Phone builds

The web preview is for looking and clicking. Installable iPhone/Android builds still come from Expo EAS (see `setup-no-terminal.md`, section 3) — point `EXPO_PUBLIC_API_URL` in `apps/mobile/eas.json` at the API URL you want the phone to talk to (Replit's `:3000` URL for testing, or a deployed one).

## Publishing (later)

When you want a URL that stays up without the workspace open, use Replit's **Deploy** button — the project is pre-configured for a Reserved VM deployment that runs the same start script.
