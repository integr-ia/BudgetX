import { defineConfig } from "drizzle-kit";

// PGlite tourne dans le navigateur : les migrations sont appliquées au runtime
// (db/client.ts). Cette config sert uniquement à générer le SQL de référence.
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  driver: "pglite",
});
