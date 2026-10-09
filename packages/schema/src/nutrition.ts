import { z } from "zod";
import { BenefitTag, MealMoment } from "./enums";
import { FuelProfile } from "./planning";

export const MealOptionsInput = z.object({
  moment: MealMoment,
  fuelProfile: FuelProfile,
  cuisinePrefs: z.array(z.string()),
  dietaryPattern: z.string(),
  minutesToNextSession: z.number().int().optional(),
  /** Dine-out only: candidate menu items from Places + our menu cache. */
  candidates: z
    .array(z.object({ restaurantPlaceId: z.string(), restaurantName: z.string(), menuItemName: z.string(), distanceM: z.number() }))
    .optional(),
  recentlyRejected: z.array(z.string()).default([]),
});
export type MealOptionsInput = z.infer<typeof MealOptionsInput>;

/** Minor-safe: no calories, no macros. The adult schema extends this. */
export const MealOption = z.object({
  name: z.string().max(60),
  description: z.string().max(200),
  benefitTags: z.array(BenefitTag).min(1).max(3),
  portionGuide: z.string().max(120),
  restaurantPlaceId: z.string().optional(),
  menuItemName: z.string().optional(),
  distanceM: z.number().optional(),
});
export type MealOption = z.infer<typeof MealOption>;

export const MealOptions = z.object({ options: z.array(MealOption).length(3) });
export type MealOptions = z.infer<typeof MealOptions>;

export const MealOptionAdult = MealOption.extend({
  calories: z.number().int().optional(),
  macros: z.object({ proteinG: z.number(), carbsG: z.number(), fatG: z.number() }).optional(),
});
