import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, forAthlete } from "../../gateway/trpc";
import { athleteProfiles, mealSuggestions, mealHistory, restaurantMenuCache, trainingPlans, aiMemory } from "@relaax/db/src/core";
import { generateMealOptions, PROMPT_VERSIONS, MODEL_FOR } from "@relaax/ai";
import { MealMoment, type FuelProfile } from "@relaax/schema";
import { nearbyRestaurants, GENERIC_MENU } from "./places";
import { bumpStreak } from "../achievements/streaks";

const DEFAULT_FUEL: FuelProfile = { preSession: "balanced", postSession: "balanced", hydration: "normal", timingNotes: "" };

async function fuelAndPrefs(ctx: { db: any; athleteId: string }) {
  const [p] = await ctx.db.select().from(athleteProfiles).where(eq(athleteProfiles.userId, ctx.athleteId)).limit(1);
  const [plan] = await ctx.db.select().from(trainingPlans).where(eq(trainingPlans.athleteUserId, ctx.athleteId)).orderBy(desc(trainingPlans.createdAt)).limit(1);
  const rejected = await ctx.db.select().from(aiMemory).where(and(eq(aiMemory.athleteUserId, ctx.athleteId), eq(aiMemory.kind, "preference"))).limit(30);
  return {
    fuelProfile: (plan?.plan.fuelProfile as FuelProfile | undefined) ?? DEFAULT_FUEL,
    cuisinePrefs: (p?.cuisinePrefs as string[]) ?? [], dietaryPattern: (p?.dietaryPattern as string) ?? "none",
    recentlyRejected: rejected.filter((r: { content: string }) => r.content.startsWith("skips:")).map((r: { content: string }) => r.content.slice(6)),
  };
}

export const nutritionRouter = router({
  suggest: forAthlete.input(z.object({ moment: MealMoment, minutesToNextSession: z.number().int().optional() })).mutation(async ({ ctx, input }) => {
    const base = await fuelAndPrefs(ctx);
    const out = await generateMealOptions(ctx.llm, { moment: input.moment, minutesToNextSession: input.minutesToNextSession, ...base });
    const [row] = await ctx.db.insert(mealSuggestions).values({ athleteUserId: ctx.athleteId, moment: input.moment, context: { ...base, minutesToNextSession: input.minutesToNextSession }, options: out.options, model: MODEL_FOR.nutrition, promptVersion: PROMPT_VERSIONS.nutrition }).returning();
    return row!;
  }),

  eatOut: forAthlete.input(z.object({ moment: MealMoment, lat: z.number(), lng: z.number() })).mutation(async ({ ctx, input }) => {
    const base = await fuelAndPrefs(ctx);
    const places = await nearbyRestaurants(input.lat, input.lng);
    const candidates: { restaurantPlaceId: string; restaurantName: string; menuItemName: string; distanceM: number }[] = [];
    for (const r of places.slice(0, 6)) {
      const [cache] = await ctx.db.select().from(restaurantMenuCache).where(eq(restaurantMenuCache.placeId, r.placeId)).limit(1);
      const items = cache?.items.map((i) => i.name) ?? GENERIC_MENU.slice(0, 3);
      for (const name of items.slice(0, 4)) candidates.push({ restaurantPlaceId: r.placeId, restaurantName: r.name, menuItemName: name, distanceM: r.distanceM });
    }
    if (!candidates.length) return { restaurants: [], suggestion: null };
    const out = await generateMealOptions(ctx.llm, { moment: input.moment, candidates, ...base });
    const [row] = await ctx.db.insert(mealSuggestions).values({ athleteUserId: ctx.athleteId, moment: input.moment, context: { ...base, lat: input.lat, lng: input.lng }, options: out.options, model: MODEL_FOR.nutrition, promptVersion: PROMPT_VERSIONS.nutrition }).returning();
    return { restaurants: places, suggestion: row! };
  }),

  /** Accepting a suggestion logs it. Skipping writes a negative preference so we stop offering it. */
  choose: forAthlete.input(z.object({ suggestionId: z.string().uuid(), chosenIndex: z.number().int().min(0).max(2).nullable() })).mutation(async ({ ctx, input }) => {
    const [s] = await ctx.db.select().from(mealSuggestions).where(and(eq(mealSuggestions.id, input.suggestionId), eq(mealSuggestions.athleteUserId, ctx.athleteId))).limit(1);
    if (!s) return { ok: false };
    await ctx.db.update(mealSuggestions).set({ chosenIndex: input.chosenIndex }).where(eq(mealSuggestions.id, s.id));
    if (input.chosenIndex == null) {
      for (const o of s.options) await ctx.db.insert(aiMemory).values({ athleteUserId: ctx.athleteId, kind: "preference", content: `skips:${o.name}`, sourceRef: `suggestion:${s.id}` });
      return { ok: true };
    }
    const o = s.options[input.chosenIndex]!;
    await ctx.db.insert(mealHistory).values({ athleteUserId: ctx.athleteId, source: o.restaurantPlaceId ? "dine_out" : "suggested", suggestionId: s.id, restaurantPlaceId: o.restaurantPlaceId ?? null, items: [{ name: o.name, portion: o.portionGuide, tags: o.benefitTags }], benefitTags: o.benefitTags });
    const streak = await bumpStreak(ctx.db, ctx.athleteId, "meal_logged");
    return { ok: true, streak };
  }),

  rateMeal: forAthlete.input(z.object({ mealId: z.string().uuid(), rating: z.number().int().min(1).max(5) })).mutation(async ({ ctx, input }) => {
    await ctx.db.update(mealHistory).set({ rating: input.rating }).where(and(eq(mealHistory.id, input.mealId), eq(mealHistory.athleteUserId, ctx.athleteId)));
    return { ok: true };
  }),

  history: forAthlete.query(({ ctx }) => ctx.db.select().from(mealHistory).where(eq(mealHistory.athleteUserId, ctx.athleteId)).orderBy(desc(mealHistory.loggedAt)).limit(50)),
});
