export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

export type Notify = (message: ContactMessage) => Promise<void>;

export interface MailConfig {
  apiKey: string;
  to: string;
  from: string;
}

/** Emails the owner through Resend. Returns undefined when email isn't configured. */
export function createNotifier(config: MailConfig | null): Notify | undefined {
  if (!config) return undefined;
  return async (m) => {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        reply_to: m.email,
        subject: `New message from ${m.name.replace(/[\r\n]+/g, " ")}`,
        text: `From: ${m.name} <${m.email}>\n\n${m.message}`,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Email provider answered ${res.status}`);
  };
}
