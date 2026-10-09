import { pgTable, uuid, text, timestamp, vector, index } from "drizzle-orm/pg-core";
import { users } from "./identity";

/** Non-health memory only. Health-adjacent memories live in health.coach_memory. */
export const aiMemory = pgTable("ai_memory", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  kind: text("kind").notNull(), // preference | pattern | coach_note
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  sourceRef: text("source_ref"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("ai_memory_embedding_idx").using("hnsw", t.embedding.op("vector_cosine_ops"))]);
