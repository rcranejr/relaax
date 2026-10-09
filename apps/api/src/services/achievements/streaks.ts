import { and, eq } from "drizzle-orm";
import type { CoreDb } from "@relaax/db";
import { streaks, achievements, athleteAchievements } from "@relaax/db/src/core";

export async function bumpStreak(db: CoreDb, athleteId: string, metric: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const [s] = await db.select().from(streaks).where(and(eq(streaks.athleteUserId, athleteId), eq(streaks.metric, metric))).limit(1);
  let current = 1;
  if (s) {
    if (s.lastDate === today) return { current: s.current, best: s.best, newAwards: [] as string[] };
    current = s.lastDate === yesterday ? s.current + 1 : 1;
    await db.update(streaks).set({ current, best: Math.max(s.best, current), lastDate: today }).where(and(eq(streaks.athleteUserId, athleteId), eq(streaks.metric, metric)));
  } else {
    await db.insert(streaks).values({ athleteUserId: athleteId, metric, current, best: current, lastDate: today });
  }
  const newAwards: string[] = [];
  const defs = await db.select().from(achievements);
  for (const a of defs) {
    if (a.rule.metric === metric && current >= a.rule.threshold) {
      const r = await db.insert(athleteAchievements).values({ athleteUserId: athleteId, achievementId: a.id }).onConflictDoNothing().returning();
      if (r.length) newAwards.push(a.id);
    }
  }
  return { current, best: Math.max(s?.best ?? 0, current), newAwards };
}
