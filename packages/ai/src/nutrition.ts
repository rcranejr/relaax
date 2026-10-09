import { MealOptions, MealOptionsInput } from "@relaax/schema";
import { LlmGateway } from "./gateway";
import { NUTRITION_SYSTEM } from "./prompts/nutrition";
import { PROMPT_VERSIONS } from "./prompts/versions";

export async function generateMealOptions(gw: LlmGateway, input: MealOptionsInput): Promise<MealOptions> {
  MealOptionsInput.parse(input);
  const out = await gw.structured({
    task: "nutrition",
    promptVersion: PROMPT_VERSIONS.nutrition,
    system: NUTRITION_SYSTEM,
    user: `MealOptionsInput:\n${JSON.stringify(input, null, 2)}`,
    schema: MealOptions,
    toolName: "return_meal_options",
  });
  // Dine-out: enforce that every option maps to a real candidate, whatever the model said.
  if (input.candidates?.length) {
    const ok = new Set(input.candidates.map((c) => `${c.restaurantPlaceId}|${c.menuItemName}`));
    out.options = out.options.filter((o) => ok.has(`${o.restaurantPlaceId}|${o.menuItemName}`));
    while (out.options.length < 3 && input.candidates[out.options.length]) {
      const c = input.candidates[out.options.length]!;
      out.options.push({ name: c.menuItemName, description: `From ${c.restaurantName}`, benefitTags: ["sustained_energy"], portionGuide: "One serving", restaurantPlaceId: c.restaurantPlaceId, menuItemName: c.menuItemName, distanceM: c.distanceM });
    }
  }
  return out;
}
