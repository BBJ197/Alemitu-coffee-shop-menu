import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMenu } from "../api/useMenu";
import MenuPage from "./MenuPage";

vi.mock("../api/useMenu");

describe("MenuPage header", () => {
  beforeEach(() => {
    vi.mocked(useMenu).mockReturnValue({
      isPending: true,
      isError: false,
      isFetching: true,
      refetch: vi.fn(),
      data: undefined,
    } as unknown as ReturnType<typeof useMenu>);
  });

  it("has a back to home link and the language toggle in the banner", () => {
    render(
      <MemoryRouter>
        <MenuPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
  });

  it("no longer shows the old top bar brand link", () => {
    render(
      <MemoryRouter>
        <MenuPage />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("link", { name: "Alemitu Coffee home" }),
    ).toBeNull();
  });
});
