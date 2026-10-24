import pg from "pg";

export interface Db {
  query(text: string): Promise<{ rows: Record<string, unknown>[] }>;
}

export function createPool(connectionString: string): Db {
  return new pg.Pool({ connectionString, max: 5 });
}
