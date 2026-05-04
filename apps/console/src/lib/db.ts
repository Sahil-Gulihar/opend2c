import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/opend2c?sslmode=disable";

declare global {
  // eslint-disable-next-line no-var
  var __opend2cPgPool: Pool | undefined;
}

export const db =
  globalThis.__opend2cPgPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__opend2cPgPool = db;
}

