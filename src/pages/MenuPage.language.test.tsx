import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMenu } from "../api/useMenu";
import MenuPage from "./MenuPage";

vi.mock("../api/useMenu");

const AM_NAME = "\u12A0\u121B\u122D\u129B";

type MenuState = ReturnType<typeof useMenu>;
const mockMenu = () =>
  vi.mocked(useMenu).mockReturnValue({
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    data: {
      categories: [
        { id: "c1", nameEn: "Hot drinks", nameAm: null, sortOrder: 1 },
      ],
      tags: [],
      items: [
        {
          id: "i1",
          categoryId: "c1",
          nameEn: "Macchiato",
          nameAm: AM_NAME,
          priceEtb: 55,
          isAvailable: true,
          tagIds: [],
        },
        {
          id: "i2",
          categoryId: "c1",
          nameEn: "Cappuccino",
          nameAm: null,
          priceEtb: 70,
          isAvailable: true,
          tagIds: [],
        },
      ],
    },
  } as unknown as MenuState);

const renderPage = () =>
  render(
    <MemoryRouter>
      <MenuPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  mockMenu();
});

describe("MenuPage language toggle", () => {
  it("shows English by default", () => {
    renderPage();
    expect(screen.getByText("Macchiato")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "English" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("switches to Amharic and falls back to English where there is no Amharic text", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Amharic" }));
    expect(screen.getByText(AM_NAME)).toBeTruthy();
    expect(screen.queryByText("Macchiato")).toBeNull();
    expect(screen.getByText("Cappuccino")).toBeTruthy();
    expect(document.documentElement.lang).toBe("am");
  });

  it("remembers the choice", () => {
    const first = renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Amharic" }));
    expect(localStorage.getItem("alemitu-lang")).toBe("am");
    first.unmount();
    renderPage();
    expect(screen.getByText(AM_NAME)).toBeTruthy();
  });
});
