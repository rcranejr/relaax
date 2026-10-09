import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, forAthlete, withScope } from "../../gateway/trpc";
import { ReadinessCheck } from "@relaax/schema";
import { vault } from "./vault";
import { computeLoadCeiling } from "@relaax/guardrails";
import { athleteProfiles } from "@relaax/db/src/core";
import { eq } from "drizzle-orm";
import { weekContext } from "../training/context";

export const healthRouter = router({
  /** The pre-session check. Returns today's load ceiling so the app can gate the Train tab. */
  submitReadiness: forAthlete.input(ReadinessCheck).mutation(async ({ ctx, input }) => {
    await vault.recordReadiness(ctx.session.userId, ctx.athleteId, input);
    const w = await weekContext(ctx.db, ctx.athleteId);
    const { ceiling, reasons } = computeLoadCeiling({ readiness: input, ageBand: ctx.session.ageBand, sessionsLast7d: w.sessionsLast7d, todayIsGame: w.today === "game", tomorrowIsGame: w.tomorrow === "game" });
    await ctx.db.update(athleteProfiles).set({ todayLoadCeiling: ceiling, todayCeilingAt: new Date() }).where(eq(athleteProfiles.userId, ctx.athleteId));
    return { ceiling, reasons, replan: true };
  }),

  todayReadiness: forAthlete.query(({ ctx }) => vault.todayReadiness(ctx.session.userId, ctx.athleteId)),

  logMood: forAthlete.input(z.object({ mood: z.enum(["great", "good", "ok", "low", "rough"]), triggers: z.array(z.string()).max(5), note: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const id = await vault.recordMood(ctx.session.userId, ctx.athleteId, input.mood, input.triggers, input.note);
      return { id };
    }),

  /** Parent or coach only. The minor never enters their own weight. */
  recordBodyMetric: forAthlete.input(z.object({ heightCm: z.number().positive().optional(), weightKg: z.number().positive().optional() })).mutation(async ({ ctx, input }) => {
    if (ctx.session.role === "athlete" && ctx.session.ageBand !== "adult") throw new TRPCError({ code: "FORBIDDEN", message: "a parent or coach enters body metrics" });
    await vault.recordBodyMetric(ctx.session.userId, ctx.athleteId, input.heightCm, input.weightKg);
    return { ok: true };
  }),

  upsertCapability: forAthlete.input(z.object({ clearedForContact: z.boolean(), conditions: z.array(z.string()), movementLimits: z.array(z.object({ region: z.string(), note: z.string().max(120) })) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.role !== "parent") throw new TRPCError({ code: "FORBIDDEN" });
      await vault.upsertCapability(ctx.session.userId, ctx.athleteId, input);
      return { ok: true };
    }),

  accessLog: withScope("health_view").query(({ ctx }) => vault.accessLogFor(ctx.session.userId, ctx.athleteId)),
});
