/** Formats a price in Ethiopian birr, e.g. "ETB 55", "ETB 1,250", "ETB 55.50". */
export function formatEtb(amount: number): string {
  const hasFraction = !Number.isInteger(amount);
  const text = amount.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `ETB ${text}`;
}
