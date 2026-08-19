import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // All of this app's tables live in the "evercrafted" schema (see drizzle/schema.ts) so
  // they never collide with other brands' tables sharing the same Supabase Postgres database.
  schemaFilter: ["evercrafted"],
  dbCredentials: {
    url: connectionString,
  },
});
