import { defineConfig } from "drizzle-kit";
// Separate database, separate migrations, separate KMS key in Terraform.
export default defineConfig({
  schema: "./src/health/index.ts",
  out: "./migrations/health",
  dialect: "postgresql",
  dbCredentials: { url: process.env.HEALTH_DATABASE_URL! },
  // Own journal table so the health migrations can share a server (or a database) with core.
  migrations: { table: "__drizzle_migrations_health" },
});
