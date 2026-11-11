import { call } from "../items/itemsApi";

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export async function fetchMessages(
  signal?: AbortSignal,
): Promise<ContactMessageRow[]> {
  return (await (
    await call("/messages", { signal })
  ).json()) as ContactMessageRow[];
}

export async function setMessageRead(
  id: string,
  isRead: boolean,
): Promise<ContactMessageRow> {
  const res = await call(`/messages/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ isRead }),
  });
  return (await res.json()) as ContactMessageRow;
}

export async function deleteMessage(id: string): Promise<void> {
  await call(`/messages/${id}`, { method: "DELETE" });
}
