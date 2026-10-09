import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/core/index.ts",
  out: "./migrations/core",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
