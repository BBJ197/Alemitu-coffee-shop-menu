import pg from "pg";

export interface Db {
  query(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: Record<string, unknown>[] }>;
}

export function createPool(connectionString: string): Db {
  const pool = new pg.Pool({ connectionString, max: 5 });
  return { query: (text, params) => pool.query(text, params) };
}
