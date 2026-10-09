import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, authed, publicProcedure, forAthlete } from "../../gateway/trpc";
import { users, athleteProfiles, parentLinks, consentGrants } from "@relaax/db/src/core";
import { AthleteProfile, ConsentScope, Role, isMinor, ageBandFromDob } from "@relaax/schema";

export const identityRouter = router({
  me: authed.query(async ({ ctx }) => {
    const [u] = await ctx.db.select().from(users).where(eq(users.id, ctx.session.userId)).limit(1);
    const [p] = await ctx.db.select().from(athleteProfiles).where(eq(athleteProfiles.userId, ctx.session.userId)).limit(1);
    return { user: { id: u!.id, role: u!.role, status: u!.status, ageBand: ctx.session.ageBand }, profile: p ?? null };
  }),

  /** First call after Clerk sign-up. A minor lands in pending_consent until a parent verifies. */
  register: publicProcedure
    .input(z.object({ authProviderId: z.string(), email: z.string().email().optional(), role: Role, dateOfBirth: z.coerce.date().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (input.role === "athlete" && !input.dateOfBirth) throw new TRPCError({ code: "BAD_REQUEST", message: "athletes need a date of birth" });
      const minor = input.role === "athlete" && isMinor(ageBandFromDob(input.dateOfBirth!));
      const [u] = await ctx.db.insert(users).values({
        authProviderId: input.authProviderId, email: minor ? null : input.email ?? null, role: input.role,
        dateOfBirth: input.dateOfBirth ?? null, status: minor ? "pending_consent" : "active",
      }).onConflictDoUpdate({ target: users.authProviderId, set: { role: input.role } }).returning();
      return { id: u!.id, needsParentConsent: minor };
    }),

  upsertProfile: forAthlete.input(AthleteProfile.omit({ userId: true })).mutation(async ({ ctx, input }) => {
    await ctx.db.insert(athleteProfiles).values({ userId: ctx.athleteId, ...input })
      .onConflictDoUpdate({ target: athleteProfiles.userId, set: input });
    return { ok: true };
  }),

  /** Athlete generates an invite; parent redeems it. The code is the athlete id signed in a real build. */
  inviteParent: authed.input(z.object({ relationship: z.string() })).mutation(async ({ ctx, input }) => {
    if (ctx.session.role !== "athlete") throw new TRPCError({ code: "FORBIDDEN" });
    return { inviteCode: Buffer.from(`${ctx.session.userId}|${input.relationship}`).toString("base64url") };
  }),

  redeemParentInvite: authed.input(z.object({ inviteCode: z.string(), consentMethod: z.enum(["email_plus", "card_microcharge", "id_check"]) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.role !== "parent") throw new TRPCError({ code: "FORBIDDEN" });
      const [athleteId, relationship] = Buffer.from(input.inviteCode, "base64url").toString().split("|");
      if (!athleteId) throw new TRPCError({ code: "BAD_REQUEST" });
      await ctx.db.insert(parentLinks).values({
        parentUserId: ctx.session.userId, athleteUserId: athleteId, relationship: relationship ?? "parent",
        consentStatus: "verified", consentMethod: input.consentMethod, consentedAt: new Date(),
      }).onConflictDoNothing();
      await ctx.db.update(users).set({ status: "active" }).where(and(eq(users.id, athleteId), eq(users.status, "pending_consent")));
      return { athleteId };
    }),

  grantConsent: forAthlete.input(z.object({ scope: ConsentScope, expiresAt: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
    if (ctx.session.role !== "parent") throw new TRPCError({ code: "FORBIDDEN", message: "only a verified parent grants consent" });
    await ctx.db.insert(consentGrants).values({ athleteUserId: ctx.athleteId, scope: input.scope, grantedBy: ctx.session.userId, expiresAt: input.expiresAt ?? null });
    return { ok: true };
  }),

  revokeConsent: forAthlete.input(z.object({ scope: ConsentScope })).mutation(async ({ ctx, input }) => {
    if (ctx.session.role !== "parent") throw new TRPCError({ code: "FORBIDDEN" });
    await ctx.db.update(consentGrants).set({ revokedAt: new Date() })
      .where(and(eq(consentGrants.athleteUserId, ctx.athleteId), eq(consentGrants.scope, input.scope)));
    return { ok: true };
  }),

  consents: forAthlete.query(async ({ ctx }) => {
    return ctx.db.select().from(consentGrants).where(eq(consentGrants.athleteUserId, ctx.athleteId));
  }),
});
