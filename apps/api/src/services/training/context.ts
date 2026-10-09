import { and, desc, eq, gte, inArray } from "drizzle-orm";
import type { CoreDb } from "@relaax/db";
import { athleteProfiles, drills, fitnessLogs, scheduleEvents, aiMemory } from "@relaax/db/src/core";
import type { AgeBand, LoadCeiling, PlanningContext, ReadinessCheck } from "@relaax/schema";
import { computeLoadCeiling, drillAllowed, type DrillMeta } from "@relaax/guardrails";

type Day = PlanningContext["calendar"]["today"];
const iso = (d: Date) => d.toISOString().slice(0, 10);

export async function weekContext(db: CoreDb, athleteId: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 864e5);
  const weekAgo = new Date(today.getTime() - 7 * 864e5);
  const events = await db.select().from(scheduleEvents).where(and(eq(scheduleEvents.athleteUserId, athleteId), gte(scheduleEvents.eventDate, today)));
  const byDay = (d: Date): Day => (events.find((e) => iso(e.eventDate) === iso(d))?.kind as Day) ?? "none";
  const next = events.filter((e) => e.kind === "game" || e.kind === "tournament").map((e) => e.eventDate).sort((a, b) => +a - +b)[0];
  const logs = await db.select().from(fitnessLogs).where(and(eq(fitnessLogs.athleteUserId, athleteId), gte(fitnessLogs.completedAt, weekAgo))).orderBy(desc(fitnessLogs.completedAt));
  const sessionDays = new Set(logs.map((l) => iso(l.completedAt)));
  const rpes = logs.map((l) => l.rpe).filter((r): r is number => r != null);
  return {
    today: byDay(today), tomorrow: byDay(tomorrow),
    daysToNextGame: next ? Math.min(30, Math.round((+next - +today) / 864e5)) : 30,
    sessionsLast7d: sessionDays.size,
    avgRpe: rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0,
    lastDrillIds: [...new Set(logs.map((l) => l.drillId).filter((d): d is string => !!d))].slice(0, 10),
  };
}

export function toDrillMeta(d: typeof drills.$inferSelect): DrillMeta {
  return { id: d.id, category: d.category, load: d.load as LoadCeiling, bodyRegions: d.bodyRegions, levelMin: d.levelMin, levelMax: d.levelMax, loaded: d.loaded };
}

export async function buildPlanningContext(db: CoreDb, athleteId: string, ageBand: AgeBand, readiness: ReadinessCheck) {
  const [profile] = await db.select().from(athleteProfiles).where(eq(athleteProfiles.userId, athleteId)).limit(1);
  if (!profile) throw new Error("no profile");
  const w = await weekContext(db, athleteId);
  const { ceiling, reasons } = computeLoadCeiling({ readiness, ageBand, sessionsLast7d: w.sessionsLast7d, todayIsGame: w.today === "game", tomorrowIsGame: w.tomorrow === "game" });

  const all = await db.select().from(drills);
  const metas = new Map(all.map((d) => [d.id, toDrillMeta(d)]));
  const guard = { ageBand, ceiling, sore: readiness.sore, level: profile.level };
  const available = all.filter((d) => drillAllowed(toDrillMeta(d), guard).ok && (d.positions.length === 0 || d.positions.includes(profile.primaryPosition)));
  const excluded = all.filter((d) => !available.includes(d)).map((d) => d.id);

  const prefs = await db.select().from(aiMemory).where(and(eq(aiMemory.athleteUserId, athleteId), inArray(aiMemory.kind, ["preference"]))).limit(20);
  const liked = prefs.filter((p) => p.content.startsWith("likes:")).map((p) => p.content.slice(6));
  const disliked = prefs.filter((p) => p.content.startsWith("dislikes:")).map((p) => p.content.slice(9));

  const ctx: PlanningContext = {
    athlete: { ageBand, position: profile.primaryPosition, level: profile.level, goals: profile.goals.slice(0, 5) },
    calendar: { today: w.today, tomorrow: w.tomorrow, daysToNextGame: w.daysToNextGame },
    readiness, loadCeiling: ceiling,
    recent: { sessionsLast7d: w.sessionsLast7d, avgRpe: w.avgRpe, streakDays: 0, lastDrillIds: w.lastDrillIds },
    preferences: { likedDrillTags: liked.slice(0, 10), dislikedDrillTags: disliked.slice(0, 10) },
    excludedDrillIds: excluded, availableDrillIds: available.map((d) => d.id),
  };
  return { ctx, ceiling, reasons, metas, guard };
}
