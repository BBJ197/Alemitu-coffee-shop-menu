import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./api/useMenu", () => ({
  useMenu: () => ({
    isPending: true,
    isError: false,
    data: undefined,
    isFetching: true,
    refetch: vi.fn(),
  }),
}));

describe("App routes", () => {
  it("renders the menu page at /menu", () => {
    render(
      <MemoryRouter initialEntries={["/menu"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Our Menu" }),
    ).toBeTruthy();
  });

  it("shows a not-found page for unknown addresses", () => {
    render(
      <MemoryRouter initialEntries={["/no-such-page"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "View the menu" }).getAttribute("href"),
    ).toBe("/menu");
  });
});
