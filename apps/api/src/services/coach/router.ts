import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, forAthlete } from "../../gateway/trpc";
import { athleteProfiles, aiMemory } from "@relaax/db/src/core";
import { coachReply, MODEL_FOR } from "@relaax/ai";
import { checkEscalation, FIXED_RESPONSES } from "@relaax/guardrails";
import { vault } from "../health/vault";
import { publish } from "../../events/bus";

export const coachRouter = router({
  openSession: forAthlete.mutation(async ({ ctx }) => ({ sessionId: await vault.openCoachSession(ctx.session.userId, ctx.athleteId) })),

  send: forAthlete.input(z.object({ sessionId: z.string().uuid(), message: z.string().min(1).max(1000) })).mutation(async ({ ctx, input }) => {
    // Rules layer first. A match never reaches the model.
    const esc = checkEscalation(input.message);
    if (esc.escalate && esc.kind) {
      await vault.appendCoachMessage(input.sessionId, "user", input.message, { escalationKind: esc.kind });
      const reply = FIXED_RESPONSES[esc.kind];
      await vault.appendCoachMessage(input.sessionId, "assistant", reply, { escalationKind: esc.kind });
      await publish("coach.escalated", { athleteId: ctx.athleteId, kind: esc.kind, sessionId: input.sessionId });
      return { reply, escalated: true as const };
    }
    const [p] = await ctx.db.select().from(athleteProfiles).where(eq(athleteProfiles.userId, ctx.athleteId)).limit(1);
    const memory = await ctx.db.select().from(aiMemory).where(and(eq(aiMemory.athleteUserId, ctx.athleteId))).orderBy(desc(aiMemory.createdAt)).limit(8);
    const history = await vault.coachHistory(input.sessionId);
    const recentReadiness = await vault.recentReadinessSummary(ctx.session.userId, ctx.athleteId);
    await vault.appendCoachMessage(input.sessionId, "user", input.message);
    const reply = await coachReply(ctx.llm, {
      ageBand: ctx.session.ageBand, position: p?.primaryPosition ?? "midfield",
      memoryNotes: memory.map((m) => m.content), recentReadiness, history, message: input.message,
      knownNames: p?.displayName ? [p.displayName] : [],
    });
    await vault.appendCoachMessage(input.sessionId, "assistant", reply, { model: MODEL_FOR.coach });
    return { reply, escalated: false as const };
  }),

  history: forAthlete.input(z.object({ sessionId: z.string().uuid() })).query(({ input }) => vault.coachHistory(input.sessionId, 50)),
});
