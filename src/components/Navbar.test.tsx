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

    await user.click(container.querySelector("#menu-open-button")!);
    expect(menu).toHaveClass("active");

    await user.click(container.querySelector("#menu-close-button")!);
    expect(menu).not.toHaveClass("active");
  });

  it("closes the mobile menu after a link is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<Navbar />);
    const menu = container.querySelector(".nav-menu");

    await user.click(container.querySelector("#menu-open-button")!);
    expect(menu).toHaveClass("active");

    await user.click(screen.getByRole("link", { name: "Menu" }));
    expect(menu).not.toHaveClass("active");
  });
});
