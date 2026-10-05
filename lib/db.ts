import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./../db/index";
import { DATABASE_URL } from "@/config/env";

// `prepare: false` is required when using Supabase's pgBouncer transaction pooler (port 6543).
// pgBouncer in transaction mode does not support prepared statements.
// Without this, queries intermittently fail with FK violations and connection errors.
const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });
export { db };