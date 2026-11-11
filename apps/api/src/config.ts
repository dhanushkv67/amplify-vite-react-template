/** Configuration is supplied at runtime, never committed as credentials. */
export function databaseConfig() {
  if (process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL };
  return {
    host: process.env.PGHOST ?? 'localhost',
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER ?? 'postgres',
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE ?? 'app',
  };
}
export const port = Number(process.env.PORT ?? 3000);
