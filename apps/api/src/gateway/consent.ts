import { and, eq, isNull, or, gt } from "drizzle-orm";
import type { CoreDb } from "@relaax/db";
import { consentGrants, parentLinks } from "@relaax/db/src/core";
import type { ConsentScope } from "@relaax/schema";

/**
 * "parent": actor is a verified parent of the athlete.
 * Any ConsentScope: an unrevoked, unexpired grant exists for the athlete (granted by anyone).
 * Grants for the athlete's own session (actor === athlete) are checked the same way: a minor
 * sees numbers only when a parent granted health_view.
 */
export async function hasConsent(db: CoreDb, athleteId: string, actorId: string, scope: ConsentScope | "parent"): Promise<boolean> {
  if (scope === "parent") {
    const [l] = await db.select({ id: parentLinks.id }).from(parentLinks)
      .where(and(eq(parentLinks.athleteUserId, athleteId), eq(parentLinks.parentUserId, actorId), eq(parentLinks.consentStatus, "verified"))).limit(1);
    return !!l;
  }
  if (scope === "coach_access" && actorId !== athleteId) {
    // A parent always has coach-level read access to their own athlete.
    if (await hasConsent(db, athleteId, actorId, "parent")) return true;
  }
  const now = new Date();
  const [g] = await db.select({ id: consentGrants.id }).from(consentGrants)
    .where(and(eq(consentGrants.athleteUserId, athleteId), eq(consentGrants.scope, scope), isNull(consentGrants.revokedAt), or(isNull(consentGrants.expiresAt), gt(consentGrants.expiresAt, now)))).limit(1);
  return !!g;
}
