import { eq } from "drizzle-orm";
import { router, forAthlete } from "../../gateway/trpc";
import { achievements, athleteAchievements, streaks } from "@relaax/db/src/core";

export const achievementsRouter = router({
  dashboard: forAthlete.query(async ({ ctx }) => {
    const [all, mine, st] = await Promise.all([
      ctx.db.select().from(achievements),
      ctx.db.select().from(athleteAchievements).where(eq(athleteAchievements.athleteUserId, ctx.athleteId)),
      ctx.db.select().from(streaks).where(eq(streaks.athleteUserId, ctx.athleteId)),
    ]);
    const earned = new Set(mine.map((m) => m.achievementId));
    return { badges: all.map((a) => ({ ...a, earned: earned.has(a.id) })), streaks: st };
  }),
});
