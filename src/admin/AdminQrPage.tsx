import { useEffect, useState } from "react";
import {
  downloadFile,
  isLocalAddress,
  makeQrPng,
  makeQrSvg,
  normalizeMenuUrl,
  svgDataUrl,
} from "./qr";

export default function AdminQrPage() {
  const [input, setInput] = useState(`${window.location.origin}/menu`);
  // The drawn code remembers which address it was drawn for, so a stale one
  // is never shown after the address changes.
  const [drawn, setDrawn] = useState<{ href: string; svg: string } | null>(
    null,
  );
  const [failedHref, setFailedHref] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const href = normalizeMenuUrl(input);
  const svg = href && drawn?.href === href ? drawn.svg : null;
  const failed = href !== null && failedHref === href;

  useEffect(() => {
    if (!href) return;
    let current = true;
    makeQrSvg(href).then(
      (result) => {
        if (current) setDrawn({ href, svg: result });
      },
      () => {
        if (current) setFailedHref(href);
      },
    );
    return () => {
      current = false;
    };
  }, [href]);

  async function savePng() {
    if (!href) return;
    setMessage(null);
    try {
      downloadFile(await makeQrPng(href), "alemitu-menu-qr.png");
      setMessage("PNG downloaded.");
    } catch {
      setMessage("Couldn't make the PNG. Try the SVG instead.");
    }
  }

  function saveSvg() {
    if (!svg) return;
    setMessage(null);
    downloadFile(svgDataUrl(svg), "alemitu-menu-qr.svg");
    setMessage("SVG downloaded.");
  }

  const path = href ? new URL(href).pathname : "";

  return (
    <>
      <div className="admin-page-head">
        <h1>Menu QR code</h1>
      </div>
      <p>
        Print this code for your tables. It only contains the menu's web
        address, so it keeps working when you change items or prices.
      </p>

      <div className="admin-field admin-qr-address">
        <label htmlFor="qr-address">Menu address</label>
        <input
          id="qr-address"
          type="text"
          inputMode="url"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setMessage(null);
          }}
          aria-invalid={href ? undefined : true}
          aria-describedby="qr-address-hint"
        />
        <p id="qr-address-hint" className="admin-hint">
          Use your real website address followed by /menu before you print.
        </p>
        {!href && (
          <p role="alert" className="admin-field__error">
            Enter a web address, for example https://yourcafe.com/menu
          </p>
        )}
      </div>

      {href && isLocalAddress(href) && (
        <p role="alert" className="admin-error">
          This address only works on your own computer or network. Replace it
          with your real website address before printing, or customers' phones
          won't be able to open it.
        </p>
      )}
      {href && path !== "/menu" && path !== "/menu/" && (
        <p role="status" className="admin-hint">
          This address doesn't end in /menu, so customers won't land straight on
          the menu.
        </p>
      )}

      {failed && (
        <p role="alert" className="admin-error">
          Couldn't draw the QR code. Check the address and try again.
        </p>
      )}

      {svg && href && (
        <figure className="admin-qr">
          <img
            src={svgDataUrl(svg)}
            alt={`QR code that opens ${href}`}
            width="240"
            height="240"
          />
          <figcaption className="admin-hint">{href}</figcaption>
        </figure>
      )}

      <div className="admin-form__actions">
        <button
          type="button"
          className="admin-button"
          disabled={!svg}
          onClick={() => void savePng()}
        >
          Download PNG
        </button>
        <button
          type="button"
          className="admin-button admin-button--quiet"
          disabled={!svg}
          onClick={saveSvg}
        >
          Download SVG
        </button>
      </div>
      <p className="admin-hint">
        PNG is best for printing at home or in a shop. Send the SVG to a print
        shop for signs and stickers: it stays sharp at any size.
      </p>
      {message && (
        <p role="status" className="admin-success">
          {message}
        </p>
      )}
    </>
  );
}
