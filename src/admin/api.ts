import { API_BASE } from "../api/base";

export interface AdminSession {
  email: string;
}

export class AdminApiError extends Error {
  readonly status: number;
  /** Machine-readable code from the API, for example "invalid_credentials". */
  readonly code: string | null;
  constructor(status: number, code: string | null) {
    super(`Admin request failed with status ${status}`);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

async function errorFrom(res: Response): Promise<AdminApiError> {
  const body = (await res.json().catch(() => null)) as {
    error?: unknown;
  } | null;
  return new AdminApiError(
    res.status,
    typeof body?.error === "string" ? body.error : null,
  );
}

/** Resolves to null when nobody is signed in. Throws on network or server errors. */
export async function fetchSession(
  signal?: AbortSignal,
): Promise<AdminSession | null> {
  const res = await fetch(`${API_BASE}/api/admin/me`, {
    credentials: "include",
    signal,
  });
  if (res.status === 401) return null;
  if (!res.ok) throw await errorFrom(res);
  return (await res.json()) as AdminSession;
}

export async function login(
  email: string,
  password: string,
): Promise<AdminSession> {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await errorFrom(res);
  return (await res.json()) as AdminSession;
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw await errorFrom(res);
}
