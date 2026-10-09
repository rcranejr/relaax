import { eq, and } from "drizzle-orm";
import { createCoreDb } from "@relaax/db";
import { parentLinks } from "@relaax/db/src/core";

/** Push + email to every verified parent. Expo push and SES wiring live in infra; this logs locally. */
export async function notifyParents(athleteId: string, message: string) {
  const db = createCoreDb();
  const links = await db.select().from(parentLinks).where(and(eq(parentLinks.athleteUserId, athleteId), eq(parentLinks.consentStatus, "verified")));
  for (const l of links) console.log(`[notify parent ${l.parentUserId}] ${message}`);
}
