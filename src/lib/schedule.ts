/** The shop's clock. Customers' phones may be set to any time zone. */
export const SHOP_TIME_ZONE = "Africa/Addis_Ababa";

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: SHOP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Minutes since midnight, on the shop's clock. */
export function minutesInShopTime(date: Date): number {
  const parts = clock.formatToParts(date);
  const part = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return part("hour") * 60 + part("minute");
}

/** "06:00" or "06:00:00" (what the database sends) as minutes since midnight. */
export function toMinutes(time: string | null | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time ?? "");
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours > 23 || minutes > 59 ? null : hours * 60 + minutes;
}

/**
 * Is the item being served at this time? No schedule means all day.
 * The start is included and the end is not, and a window such as 18:00 to
 * 02:00 runs past midnight.
 */
export function isServedNow(
  item: { availableFrom?: string | null; availableTo?: string | null },
  nowMinutes: number,
): boolean {
  const from = toMinutes(item.availableFrom);
  const to = toMinutes(item.availableTo);
  if (from === null || to === null || from === to) return true;
  return from < to
    ? nowMinutes >= from && nowMinutes < to
    : nowMinutes >= from || nowMinutes < to;
}

/** "06:00–11:00" for showing the hours to customers. */
export function formatHours(
  from: string | null | undefined,
  to: string | null | undefined,
): string {
  const pretty = (time: string | null | undefined) => time?.slice(0, 5) ?? "";
  return `${pretty(from)}–${pretty(to)}`;
}
