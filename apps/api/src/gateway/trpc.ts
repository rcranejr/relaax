import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Ctx } from "./context";
import { hasConsent } from "./consent";
import { minorSafe } from "./serializer";
import type { ConsentScope } from "@relaax/schema";

const t = initTRPC.context<Ctx>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

/** Every response passes through the minor-safe serializer. Applied once, here. */
export const safeOutput = t.middleware(async ({ ctx, next }) => {
  const r = await next();
  if (r.ok && ctx.session) {
    const minor = ctx.session.role === "athlete" && ctx.session.ageBand !== "adult";
    const canSeeNumbers = !minor || (await hasConsent(ctx.db, ctx.session.userId, ctx.session.userId, "health_view"));
    if (!canSeeNumbers) (r as { data: unknown }).data = minorSafe(r.data);
  }
  return r;
});

export const authed = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, session: ctx.session } });
});

/**
 * Resolves which athlete this call is about: the caller when they are an athlete,
 * else the x-athlete-id header after checking the caller is a verified parent/coach for them.
 */
export const forAthlete = authed.use(safeOutput).use(async ({ ctx, next }) => {
  const s = ctx.session;
  let athleteId = s.userId;
  if (s.role !== "athlete") {
    if (!s.actingForAthleteId) throw new TRPCError({ code: "BAD_REQUEST", message: "x-athlete-id required" });
    const scope: ConsentScope | "parent" = s.role === "coach" ? "coach_access" : "parent";
    if (!(await hasConsent(ctx.db, s.actingForAthleteId, s.userId, scope))) throw new TRPCError({ code: "FORBIDDEN" });
    athleteId = s.actingForAthleteId;
  }
  return next({ ctx: { ...ctx, athleteId } });
});

/** Gate a procedure on a specific consent scope for the athlete. */
export const withScope = (scope: ConsentScope) =>
  forAthlete.use(async ({ ctx, next }) => {
    if (!(await hasConsent(ctx.db, ctx.athleteId, ctx.session.userId, scope))) {
      throw new TRPCError({ code: "FORBIDDEN", message: `missing consent: ${scope}` });
    }
    return next();
  });

