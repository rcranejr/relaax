import { router } from "./gateway/trpc";
import { identityRouter } from "./services/identity/router";
import { healthRouter } from "./services/health/router";
import { trainingRouter } from "./services/training/router";
import { nutritionRouter } from "./services/nutrition/router";
import { coachRouter } from "./services/coach/router";
import { achievementsRouter } from "./services/achievements/router";

export const appRouter = router({
  identity: identityRouter,
  health: healthRouter,
  training: trainingRouter,
  nutrition: nutritionRouter,
  coach: coachRouter,
  achievements: achievementsRouter,
});
export type AppRouter = typeof appRouter;
