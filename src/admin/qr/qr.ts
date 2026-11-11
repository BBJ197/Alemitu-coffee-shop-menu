import QRCode from "qrcode";

/**
 * Turns what the admin typed into a clean web address, or null if it isn't one.
 * "cafe.example.com/menu" becomes "https://cafe.example.com/menu".
 */
export function normalizeMenuUrl(input: string): string | null {
  const text = input.trim();
  if (!text || /\s/.test(text)) return null;
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(text)
    ? text
    : `https://${text}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost")
      return null;
    return url.href;
  } catch {
    return null;
  }
}

/** True for addresses that only work on this computer or home network. */
export function isLocalAddress(href: string): boolean {
  const host = new URL(href).hostname;
  return (
    host === "localhost" ||
    host.endsWith(".local") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

export function makeQrSvg(href: string): Promise<string> {
  return QRCode.toString(href, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

/** A large PNG (1024 px) so it stays sharp when printed. */
export function makeQrPng(href: string): Promise<string> {
  return QRCode.toDataURL(href, {
    width: 1024,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

export const svgDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export function downloadFile(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
