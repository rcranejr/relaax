import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as core from "./core";
import * as health from "./health";

export { core, health };
export * as coreSchema from "./core";
export * as healthSchema from "./health";

export function createCoreDb(url = process.env.DATABASE_URL!) {
  return drizzle(postgres(url), { schema: core });
}
/** Only services/health may import this. Enforced by eslint boundaries in apps/api. */
export function createHealthDb(url = process.env.HEALTH_DATABASE_URL!) {
  return drizzle(postgres(url), { schema: health });
}
export type CoreDb = ReturnType<typeof createCoreDb>;
export type HealthDb = ReturnType<typeof createHealthDb>;
