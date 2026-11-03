import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Contact from "./Contact";

async function fillAndSend() {
  const user = userEvent.setup();
  render(<Contact />);
  await user.type(screen.getByLabelText("Your name"), "Abel");
  await user.type(screen.getByLabelText("Your email"), "abel@example.com");
  await user.type(screen.getByLabelText("Your message"), "Hello");
  await user.click(screen.getByRole("button", { name: "Submit" }));
}

describe("Contact form", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the message to the API, confirms and clears the form", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('{"ok":true}', { status: 201 }));
    await fillAndSend();

    expect(await screen.findByRole("status")).toHaveTextContent(
      /message was sent/i,
    );
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("/api/contact");
    expect(JSON.parse(String(init?.body))).toEqual({
      name: "Abel",
      email: "abel@example.com",
      message: "Hello",
      website: "",
    });
    expect(screen.getByLabelText("Your name")).toHaveValue("");
    expect(screen.getByLabelText("Your message")).toHaveValue("");
  });

  it("shows an error and keeps what was typed when sending fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 500 }),
    );
    await fillAndSend();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn't send/i,
    );
    expect(screen.getByLabelText("Your message")).toHaveValue("Hello");
  });

  it("explains when the visitor is sending too many messages", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 429 }),
    );
    await fillAndSend();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /try again later/i,
    );
  });
});
