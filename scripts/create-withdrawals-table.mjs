import "dotenv/config";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);
await sql(`CREATE TABLE IF NOT EXISTS investment_withdrawals (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investment_id text NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  date date NOT NULL,
  note text,
  created_at timestamp NOT NULL DEFAULT now()
)`);
console.log("OK: investment_withdrawals created");
