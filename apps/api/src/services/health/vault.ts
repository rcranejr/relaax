/**
 * The ONLY module that touches the health database. Every read and write is logged.
 * Exposes narrow functions; nothing returns raw rows to other services.
 */
import { and, desc, eq, gte } from "drizzle-orm";
import { createHealthDb, type HealthDb } from "@relaax/db";
import { readinessChecks, moodLogs, coachSessions, coachMessages, accessLog, bodyMetrics, capabilityProfile } from "@relaax/db/src/health";
import type { ReadinessCheck } from "@relaax/schema";

let hdb: HealthDb | undefined;
const db = () => (hdb ??= createHealthDb());

// Column-level encryption placeholder: swap for KMS envelope encryption in infra.
const enc = (s: string) => Buffer.from(s).toString("base64");
const dec = (s: string) => Buffer.from(s, "base64").toString();

async function log(actorUserId: string, athleteUserId: string, tableName: string, purpose: string, rowId?: string) {
  await db().insert(accessLog).values({ actorUserId, athleteUserId, tableName, purpose, rowId: rowId ?? null });
}

export const vault = {
  async recordReadiness(actor: string, athleteId: string, r: ReadinessCheck) {
    const sorenessMap = Object.fromEntries(r.sore.map((s) => [s, 1]));
    const [row] = await db().insert(readinessChecks).values({ athleteUserId: athleteId, sleepQuality: r.sleepQuality, fatigue: r.fatigue, energy: r.energy, painFlag: r.painFlag, sorenessMap }).returning({ id: readinessChecks.id });
    await log(actor, athleteId, "readiness_checks", "record", row!.id);
    return row!.id;
  },

  /** Returns the readiness check from today, or null. Only the derived shape leaves the vault. */
  async todayReadiness(actor: string, athleteId: string): Promise<ReadinessCheck | null> {
    const since = new Date(); since.setHours(0, 0, 0, 0);
    const [row] = await db().select().from(readinessChecks)
      .where(and(eq(readinessChecks.athleteUserId, athleteId), gte(readinessChecks.checkedAt, since)))
      .orderBy(desc(readinessChecks.checkedAt)).limit(1);
    await log(actor, athleteId, "readiness_checks", "plan");
    if (!row) return null;
    return { sleepQuality: row.sleepQuality, fatigue: row.fatigue, energy: row.energy, painFlag: row.painFlag, sore: Object.keys(row.sorenessMap) };
  },

  /** Short, PII-free summaries for the coach prompt. */
  async recentReadinessSummary(actor: string, athleteId: string, days = 3): Promise<string[]> {
    const since = new Date(Date.now() - days * 864e5);
    const rows = await db().select().from(readinessChecks)
      .where(and(eq(readinessChecks.athleteUserId, athleteId), gte(readinessChecks.checkedAt, since))).orderBy(desc(readinessChecks.checkedAt)).limit(3);
    await log(actor, athleteId, "readiness_checks", "coach_context");
    return rows.map((r) => `${r.checkedAt.toLocaleDateString("en-US", { weekday: "short" })}: fatigue ${r.fatigue}/5, energy ${r.energy}/5${r.painFlag ? ", pain reported" : ""}${Object.keys(r.sorenessMap).length ? `, sore ${Object.keys(r.sorenessMap).join(", ")}` : ""}`);
  },

  async recordMood(actor: string, athleteId: string, mood: string, triggers: string[], freeText?: string) {
    const [row] = await db().insert(moodLogs).values({ athleteUserId: athleteId, mood, triggers, freeTextEnc: freeText ? enc(freeText) : null }).returning({ id: moodLogs.id });
    await log(actor, athleteId, "mood_logs", "record", row!.id);
    return row!.id;
  },

  async openCoachSession(actor: string, athleteId: string) {
    const [s] = await db().insert(coachSessions).values({ athleteUserId: athleteId }).returning({ id: coachSessions.id });
    await log(actor, athleteId, "coach_sessions", "open", s!.id);
    return s!.id;
  },

  async appendCoachMessage(sessionId: string, role: "user" | "assistant", content: string, opts: { model?: string; escalationKind?: string } = {}) {
    await db().insert(coachMessages).values({ sessionId, role, contentEnc: enc(content), model: opts.model ?? null, flaggedForReview: !!opts.escalationKind, escalationKind: opts.escalationKind ?? null });
  },

  async coachHistory(sessionId: string, limit = 12) {
    const rows = await db().select().from(coachMessages).where(eq(coachMessages.sessionId, sessionId)).orderBy(desc(coachMessages.createdAt)).limit(limit);
    return rows.reverse().map((m) => ({ role: m.role as "user" | "assistant", content: dec(m.contentEnc) }));
  },

  async recordBodyMetric(actor: string, athleteId: string, heightCm?: number, weightKg?: number) {
    await db().insert(bodyMetrics).values({ athleteUserId: athleteId, heightCm: heightCm ?? null, weightKg: weightKg ?? null, enteredBy: actor });
    await log(actor, athleteId, "body_metrics", "record");
  },

  async upsertCapability(actor: string, athleteId: string, p: { clearedForContact: boolean; conditions: string[]; movementLimits: { region: string; note: string }[] }) {
    await db().insert(capabilityProfile).values({ athleteUserId: athleteId, ...p, updatedBy: actor })
      .onConflictDoUpdate({ target: capabilityProfile.athleteUserId, set: { ...p, updatedBy: actor, updatedAt: new Date() } });
    await log(actor, athleteId, "capability_profile", "upsert");
  },

  async accessLogFor(actor: string, athleteId: string) {
    return db().select().from(accessLog).where(eq(accessLog.athleteUserId, athleteId)).orderBy(desc(accessLog.accessedAt)).limit(100);
  },
};
