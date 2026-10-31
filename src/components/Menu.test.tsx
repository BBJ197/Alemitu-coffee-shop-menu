import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Menu from "./Menu";

describe("Menu band", () => {
  it("sends visitors to the full menu page", () => {
    render(<Menu />, { wrapper: MemoryRouter });

    expect(
      screen.getByRole("link", { name: "See the full menu" }),
    ).toHaveAttribute("href", "/menu");
  });

  it("shows no category cards, only the one link", () => {
    render(<Menu />, { wrapper: MemoryRouter });

    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
