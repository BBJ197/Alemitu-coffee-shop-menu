import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Hero from "./Hero";

describe("Hero", () => {
  it("has a single level-one heading", () => {
    render(<Hero />, { wrapper: MemoryRouter });

    expect(
      screen.getAllByRole("heading", { level: 1, name: "Best Coffee" }),
    ).toHaveLength(1);
  });

  it("describes the hero image for screen readers", () => {
    render(<Hero />, { wrapper: MemoryRouter });

    expect(screen.getByRole("img", { name: /jebena/i })).toBeInTheDocument();
  });

  it("links to the menu without implying online ordering", () => {
    render(<Hero />, { wrapper: MemoryRouter });

    expect(screen.getByRole("link", { name: "View Menu" })).toHaveAttribute(
      "href",
      "/menu",
    );
    expect(screen.queryByText("Order Now")).toBeNull();
  });
});
