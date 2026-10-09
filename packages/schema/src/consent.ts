import { z } from "zod";
import { ConsentScope } from "./enums";

export const ConsentGrant = z.object({
  athleteUserId: z.string().uuid(),
  scope: ConsentScope,
  grantedBy: z.string().uuid(),
  grantedAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable(),
  revokedAt: z.coerce.date().nullable(),
});
export type ConsentGrant = z.infer<typeof ConsentGrant>;

export const ParentLinkStatus = z.enum(["pending", "verified", "revoked"]);
