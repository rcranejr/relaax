/**
 * 5 a.m. local job: generate today's plan for every active athlete who has a profile.
 * Run with: pnpm --filter @relaax/api exec tsx src/jobs/dailyPlanner.ts
 */
import { eq } from "drizzle-orm";
import { createCoreDb } from "@relaax/db";
import { users, athleteProfiles, trainingPlans } from "@relaax/db/src/core";
import { ageBandFromDob } from "@relaax/schema";
import { LlmGateway, generateDailyPlan, PROMPT_VERSIONS, MODEL_FOR } from "@relaax/ai";
import { validatePlan } from "@relaax/guardrails";
import { buildPlanningContext } from "../services/training/context";
import { vault } from "../services/health/vault";

const db = createCoreDb();
const llm = new LlmGateway((l) => console.log(JSON.stringify(l)));
const SYSTEM_ACTOR = "00000000-0000-0000-0000-000000000000";
const today = new Date(); today.setHours(0, 0, 0, 0);

const athletes = await db.select({ id: users.id, dob: users.dateOfBirth }).from(users).innerJoin(athleteProfiles, eq(athleteProfiles.userId, users.id)).where(eq(users.status, "active"));
let n = 0;
for (const a of athletes) {
  try {
    const readiness = (await vault.todayReadiness(SYSTEM_ACTOR, a.id)) ?? { sleepQuality: 3, fatigue: 2, energy: 3, painFlag: false, sore: [] };
    const ageBand = a.dob ? ageBandFromDob(a.dob) : "adult";
    const { ctx, ceiling, metas, guard } = await buildPlanningContext(db, a.id, ageBand, readiness);
    const raw = await generateDailyPlan(llm, ctx);
    const { plan } = validatePlan(raw, { ...guard, drills: metas });
    await db.insert(trainingPlans).values({ athleteUserId: a.id, planDate: today, plan, loadCeiling: ceiling, model: MODEL_FOR.planner, promptVersion: PROMPT_VERSIONS.planner });
    n++;
  } catch (e) {
    console.error(`plan failed for ${a.id}`, e);
  }
}
console.log(`planned ${n}/${athletes.length}`);
process.exit(0);
