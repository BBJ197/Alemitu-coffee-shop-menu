import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Navbar from "./Navbar";

describe("Navbar", () => {
  it("opens and closes the mobile menu", async () => {
    const user = userEvent.setup();
    const { container } = render(<Navbar />);
    const menu = container.querySelector(".nav-menu");

    expect(menu).not.toHaveClass("active");

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(menu).toHaveClass("active");

    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(menu).not.toHaveClass("active");
  });

  it("closes the mobile menu after a link is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<Navbar />);
    const menu = container.querySelector(".nav-menu");

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(menu).toHaveClass("active");

    await user.click(screen.getByRole("link", { name: "Menu" }));
    expect(menu).not.toHaveClass("active");
  });

  it("keeps the close button inside a list item", () => {
    render(<Navbar />);
    const closeButton = screen.getByRole("button", { name: "Close menu" });

    expect(closeButton.parentElement?.tagName).toBe("LI");
  });

  it("does not use a heading for the brand name", () => {
    render(<Navbar />);

    expect(screen.queryByRole("heading")).toBeNull();
  });
});
