import { API_BASE } from "./base";

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  /** Hidden honeypot field. Real visitors leave it empty. */
  website?: string;
}

export class ContactError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Contact request failed with status ${status}`);
    this.name = "ContactError";
    this.status = status;
  }
}

export async function sendContact(payload: ContactPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new ContactError(res.status);
}
