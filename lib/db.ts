import { Pool } from "pg";

const globalForPostgres = globalThis as typeof globalThis & {
  gridironPostgresPool?: Pool;
};

export function getDbPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("The managed PostgreSQL connection is not configured.");
  }

  if (!globalForPostgres.gridironPostgresPool) {
    globalForPostgres.gridironPostgresPool = new Pool({ connectionString });
  }

  return globalForPostgres.gridironPostgresPool;
}
