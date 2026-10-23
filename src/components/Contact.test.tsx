import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Contact from "./Contact";

describe("Contact form", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits the entered values and clears the form", async () => {
    const user = userEvent.setup();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    render(<Contact />);

    const name = screen.getByLabelText("Your name");
    const email = screen.getByLabelText("Your email");
    const message = screen.getByLabelText("Your message");

    await user.type(name, "Abel");
    await user.type(email, "abel@example.com");
    await user.type(message, "Hello");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(log).toHaveBeenCalledWith("Form submitted:", {
      name: "Abel",
      email: "abel@example.com",
      message: "Hello",
    });
    expect(name).toHaveValue("");
    expect(email).toHaveValue("");
    expect(message).toHaveValue("");
  });
});
