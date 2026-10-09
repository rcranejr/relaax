import { DailyPlan, PlanningContext } from "@relaax/schema";
import { LlmGateway } from "./gateway";
import { PLANNER_SYSTEM } from "./prompts/planner";
import { PROMPT_VERSIONS } from "./prompts/versions";

export async function generateDailyPlan(gw: LlmGateway, ctx: PlanningContext): Promise<DailyPlan> {
  PlanningContext.parse(ctx); // never send an unvalidated context
  return gw.structured({
    task: "planner",
    promptVersion: PROMPT_VERSIONS.planner,
    system: PLANNER_SYSTEM,
    user: `PlanningContext:\n${JSON.stringify(ctx, null, 2)}`,
    schema: DailyPlan,
    toolName: "return_daily_plan",
  });
}
