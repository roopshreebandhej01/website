import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/index";
import { DATABASE_URL } from "@/config/env";

// In Next.js dev mode, HMR re-evaluates modules on every change.
// Without a global singleton, a new postgres client is created on
// every reload, quickly exhausting Supabase's 15-connection pool.
// We store the client on `globalThis` so it is reused across reloads.
declare global {
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

const maxConnections = Math.max(
  1,
  Number.parseInt(process.env.DATABASE_MAX_CONNECTIONS ?? "1", 10) || 1,
);

const client =
  globalThis.__pgClient ??
  postgres(DATABASE_URL, {
    max: maxConnections, // session-mode pools are capped across all app instances
    idle_timeout: 20, // release idle connections after 20 s
    connect_timeout: 10,
    // NOTE: do NOT set prepare:false here — that is only needed for PgBouncer
    // transaction mode (port 6543). Session mode supports prepared statements fine.
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgClient = client;
}

export const db = drizzle(client, { schema });
