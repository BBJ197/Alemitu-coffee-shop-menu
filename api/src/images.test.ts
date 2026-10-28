// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import type { Db } from "./db";
import { MAX_IMAGE_BYTES, looksLikeWebp } from "./images";

const ORIGIN = "http://localhost:5173";
const ID = "9a7d6c5b-4e3f-4a2b-8c1d-0e9f8a7b6c5d";

function webp(extra = 20): Uint8Array {
  const bytes = new Uint8Array(12 + extra);
  bytes.set(new TextEncoder().encode("RIFF"), 0);
  bytes.set(new TextEncoder().encode("WEBP"), 8);
  return bytes;
}

type Result = { rows: Record<string, unknown>[] };

function setup(
  handler: (text: string) => Result | Promise<Result> = () => ({ rows: [] }),
) {
  const query = vi.fn(async (text: string, _params: unknown[] = []) => {
    if (text.includes("from sessions s join admins"))
      return { rows: [{ id: "a1", email: "boss@example.com" }] };
    return handler(text);
  });
  const app = createApp({ query } as Db, { corsOrigin: ORIGIN });
  const upload = (
    body: Uint8Array | string,
    headers: Record<string, string> = {},
  ) =>
    app.request("/api/admin/images", {
      method: "POST",
      headers: {
        "content-type": "image/webp",
        origin: ORIGIN,
        cookie: "alemitu_session=test",
        ...headers,
      },
      body: body as BodyInit,
    });
  const inserts = () =>
    query.mock.calls.filter(([text]) => /insert into images/.test(text));
  return { app, query, upload, inserts };
}

describe("looksLikeWebp", () => {
  it("accepts WebP and rejects other files", () => {
    expect(looksLikeWebp(webp())).toBe(true);
    expect(looksLikeWebp(new TextEncoder().encode("<svg></svg> padding"))).toBe(
      false,
    );
    expect(looksLikeWebp(new Uint8Array(5))).toBe(false);
  });
});

describe("serving photos", () => {
  it("serves a stored photo to anyone, cached for a year", async () => {
    const { app } = setup(() => ({ rows: [{ data: Buffer.from(webp()) }] }));
    const res = await app.request(`/api/images/${ID}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/webp");
    expect(res.headers.get("cache-control")).toContain("immutable");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect((await res.arrayBuffer()).byteLength).toBe(32);
  });

  it("answers 404 for an unknown or malformed id", async () => {
    const { app } = setup();
    expect((await app.request(`/api/images/${ID}`)).status).toBe(404);
    expect((await app.request("/api/images/nope")).status).toBe(404);
  });
});

describe("uploading photos", () => {
  it("rejects anonymous uploads without touching the database", async () => {
    const { app, query } = setup();
    const res = await app.request("/api/admin/images", {
      method: "POST",
      headers: { "content-type": "image/webp" },
      body: webp() as BodyInit,
    });
    expect(res.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  it("stores a WebP photo and returns its path", async () => {
    const { upload, inserts } = setup(() => ({ rows: [{ id: ID }] }));
    const res = await upload(webp());
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ path: `/api/images/${ID}` });
    expect(inserts()).toHaveLength(1);
    expect(inserts()[0]?.[1]?.[0]).toBe(32);
  });

  it("rejects files that are not WebP, even if labelled as such", async () => {
    const { upload, inserts } = setup();
    const res = await upload("<svg onload=alert(1)></svg> and more padding");
    expect(res.status).toBe(415);
    expect(inserts()).toHaveLength(0);
  });

  it("rejects an empty upload", async () => {
    const { upload, inserts } = setup();
    expect((await upload(new Uint8Array(0))).status).toBe(400);
    expect(inserts()).toHaveLength(0);
  });

  it("rejects a photo over the size limit", async () => {
    const { upload, inserts } = setup();
    const res = await upload(webp(MAX_IMAGE_BYTES));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "too_large" });
    expect(inserts()).toHaveLength(0);
  });

  it("blocks uploads from another origin", async () => {
    const { upload, inserts } = setup();
    const res = await upload(webp(), { origin: "http://evil.example" });
    expect(res.status).toBe(403);
    expect(inserts()).toHaveLength(0);
  });

  it("still succeeds when the old-photo cleanup fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { upload } = setup((text) => {
      if (/delete from images/.test(text)) throw new Error("boom");
      return { rows: [{ id: ID }] };
    });
    expect((await upload(webp())).status).toBe(201);
    spy.mockRestore();
  });
});
