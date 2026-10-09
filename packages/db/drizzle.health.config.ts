import { defineConfig } from "drizzle-kit";
// Separate database, separate migrations, separate KMS key in Terraform.
export default defineConfig({
  schema: "./src/health/index.ts",
  out: "./migrations/health",
  dialect: "postgresql",
  dbCredentials: { url: process.env.HEALTH_DATABASE_URL! },
});
