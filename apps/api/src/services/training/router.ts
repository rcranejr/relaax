import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, forAthlete } from "../../gateway/trpc";
import { drills, trainingPlans, fitnessLogs, scheduleEvents, aiMemory } from "@relaax/db/src/core";
import { generateDailyPlan, PROMPT_VERSIONS, MODEL_FOR } from "@relaax/ai";
import { validatePlan } from "@relaax/guardrails";
import { buildPlanningContext } from "./context";
import { vault } from "../health/vault";
import { bumpStreak } from "../achievements/streaks";

const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export const trainingRouter = router({
  drills: forAthlete.query(({ ctx }) => ctx.db.select().from(drills)),

  todayPlan: forAthlete.query(async ({ ctx }) => {
    const [p] = await ctx.db.select().from(trainingPlans).where(and(eq(trainingPlans.athleteUserId, ctx.athleteId), eq(trainingPlans.planDate, today()))).orderBy(desc(trainingPlans.createdAt)).limit(1);
    return p ?? null;
  }),

  /** Generate (or regenerate after a readiness check) today's plan. */
  generatePlan: forAthlete.mutation(async ({ ctx }) => {
    const readiness = (await vault.todayReadiness(ctx.session.userId, ctx.athleteId)) ?? { sleepQuality: 3, fatigue: 2, energy: 3, painFlag: false, sore: [] };
    const { ctx: pc, ceiling, metas, guard } = await buildPlanningContext(ctx.db, ctx.athleteId, ctx.session.ageBand, readiness);
    const raw = await generateDailyPlan(ctx.llm, pc);
    const { plan, dropped } = validatePlan(raw, { ...guard, drills: metas });
    if (dropped.length) ctx.db; // dropped reasons are already in plan.flags; log at request level
    const [row] = await ctx.db.insert(trainingPlans).values({ athleteUserId: ctx.athleteId, planDate: today(), plan, loadCeiling: ceiling, model: MODEL_FOR.planner, promptVersion: PROMPT_VERSIONS.planner }).returning();
    return row!;
  }),

  logWorkout: forAthlete.input(z.object({ planId: z.string().uuid().optional(), drillId: z.string().optional(), sessionType: z.string(), durationS: z.number().int().optional(), reps: z.number().int().optional(), rpe: z.number().min(0).max(10).optional(), rating: z.number().int().min(1).max(5).optional(), notes: z.string().max(280).optional() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(fitnessLogs).values({ athleteUserId: ctx.athleteId, ...input });
      // Preference signal: a 5-star drill teaches us its tags; a 1-star teaches the opposite.
      if (input.drillId && input.rating && input.rating !== 3) {
        const [d] = await ctx.db.select().from(drills).where(eq(drills.id, input.drillId)).limit(1);
        for (const tag of d?.tags ?? []) await ctx.db.insert(aiMemory).values({ athleteUserId: ctx.athleteId, kind: "preference", content: `${input.rating >= 4 ? "likes" : "dislikes"}:${tag}`, sourceRef: `drill:${input.drillId}` });
      }
      const streak = await bumpStreak(ctx.db, ctx.athleteId, "daily_session");
      return { ok: true, streak };
    }),

  upsertSchedule: forAthlete.input(z.object({ events: z.array(z.object({ kind: z.enum(["practice_am", "practice_pm", "game", "tournament"]), date: z.coerce.date() })) })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(scheduleEvents).where(eq(scheduleEvents.athleteUserId, ctx.athleteId));
    if (input.events.length) await ctx.db.insert(scheduleEvents).values(input.events.map((e) => ({ athleteUserId: ctx.athleteId, kind: e.kind, eventDate: e.date })));
    return { ok: true };
  }),
});
