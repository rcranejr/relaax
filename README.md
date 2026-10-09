# ReLaax

Training, fuel, and recruiting for youth lacrosse athletes (8-18), with a parent-gated, health-isolated backend. See the [Architecture Blueprint](https://claude.ai/code/artifact/f97e69a5-7e11-430e-aa3f-c30ba7a2a18b) for the design and roadmap.

## What's here (Phase 1)

| Path | What |
| --- | --- |
| `apps/mobile` | Expo (SDK 54) + Expo Router + NativeWind. Onboarding, 5 tabs, readiness sheet, coach chat, meal picker, eat-out, guided capture. |
| `apps/api` | Fastify + tRPC. Gateway with consent middleware and minor-safe serializer; identity, training, nutrition, health vault, coach, achievements. |
| `packages/schema` | Zod schemas shared by app and API (`PlanningContext`, `DailyPlan`, `MealOptions`, consent). |
| `packages/guardrails` | Pure functions: load ceiling, drill eligibility, plan validation, coach escalation. 16 tests. |
| `packages/db` | Drizzle schemas: `core` and the isolated `health` vault (separate database). Seed with 14 drills and 5 badges. |
| `packages/ai` | LLM gateway (per-task model routing, forced tool use, call logging), versioned prompts, PII scrubber. |

## Run it

```bash
pnpm install
docker compose up -d                # Postgres (pgvector) + Redis
cp .env.example .env                # add ANTHROPIC_API_KEY at minimum
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm --filter @relaax/api dev       # http://localhost:4000
pnpm --filter @relaax/mobile dev    # Expo; press i for iOS simulator
```

Without a Clerk key the app uses a dev sign-in (`dev:<id>` tokens) that the API accepts outside production. Without `GOOGLE_PLACES_API_KEY`, Eat Out returns no restaurants.

## Checks

```bash
pnpm typecheck   # every package and both apps
pnpm test        # guardrails, ai, api
```

## Design rules enforced in code

- A minor never sees a calorie, macro, or weight number: `apps/api/src/gateway/serializer.ts`, applied once in `forAthlete`.
- Nothing hard happens without a readiness check: `packages/guardrails/src/load.ts` sets the day's ceiling; `validatePlan` re-checks every drill the model returns.
- Health data is reachable only through `apps/api/src/services/health/vault.ts`; every access is logged. The ESLint boundary rule refuses imports elsewhere.
- The coach's escalation rules run before the model and never depend on it: `packages/guardrails/src/escalation.ts`.
- Every plan and suggestion row records `model` and `promptVersion`.

## Next

Phase 2 per the blueprint: coach memory retrieval over pgvector, dine-out menu cache, micro-lessons, parent portal (`apps/portal`). Stripe, Mux and EventBridge are stubbed behind `events/bus.ts` and the media service.
