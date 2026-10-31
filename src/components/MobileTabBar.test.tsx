import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import MobileTabBar from "./MobileTabBar";

describe("MobileTabBar", () => {
  it("links home and offers search and top buttons in English", () => {
    render(<MobileTabBar lang="en" />, { wrapper: MemoryRouter });

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Top" })).toBeInTheDocument();
  });

  it("switches its labels to Amharic", () => {
    render(<MobileTabBar lang="am" />, { wrapper: MemoryRouter });

    expect(screen.getByRole("link", { name: "መነሻ" })).toBeInTheDocument();
  });
});
