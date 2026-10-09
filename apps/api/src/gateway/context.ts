import type { FastifyRequest } from "fastify";
import { createCoreDb, type CoreDb } from "@relaax/db";
import { users, athleteProfiles } from "@relaax/db/src/core";
import { eq } from "drizzle-orm";
import { ageBandFromDob, type AgeBand, type Role } from "@relaax/schema";
import { LlmGateway } from "@relaax/ai";
import { verifyToken } from "@clerk/backend";

export interface Session {
  userId: string;
  role: Role;
  ageBand: AgeBand;
  /** For a parent or coach session, the athlete they are acting on (from x-athlete-id). */
  actingForAthleteId?: string;
}

export interface Ctx { db: CoreDb; llm: LlmGateway; session: Session | null; requestId: string }

let db: CoreDb | undefined;
let llm: LlmGateway | undefined;

export async function createContext({ req }: { req: FastifyRequest }): Promise<Ctx> {
  db ??= createCoreDb();
  llm ??= new LlmGateway((l) => req.log.info({ llm: l }));
  const auth = req.headers.authorization;
  let session: Session | null = null;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    const sub = await resolveSubject(token);
    if (sub) {
      const [u] = await db.select().from(users).where(eq(users.authProviderId, sub)).limit(1);
      if (u && u.status !== "suspended" && u.status !== "deleted") {
        session = {
          userId: u.id,
          role: u.role,
          ageBand: u.dateOfBirth ? ageBandFromDob(u.dateOfBirth) : "adult",
          actingForAthleteId: typeof req.headers["x-athlete-id"] === "string" ? req.headers["x-athlete-id"] : undefined,
        };
      }
    }
  }
  return { db, llm, session, requestId: req.id };
}

async function resolveSubject(token: string): Promise<string | null> {
  if (process.env.NODE_ENV !== "production" && token.startsWith("dev:")) return token; // local dev shortcut
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
    return payload.sub;
  } catch {
    return null;
  }
}

export async function athleteLevel(db: CoreDb, athleteId: string) {
  const [p] = await db.select({ level: athleteProfiles.level }).from(athleteProfiles).where(eq(athleteProfiles.userId, athleteId)).limit(1);
  return p?.level ?? 1;
}
