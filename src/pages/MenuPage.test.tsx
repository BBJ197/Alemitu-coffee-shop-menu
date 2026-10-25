import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMenu } from "../api/useMenu";
import MenuPage from "./MenuPage";

vi.mock("../api/useMenu");

type MenuState = ReturnType<typeof useMenu>;
const mockMenu = (state: object) =>
  vi.mocked(useMenu).mockReturnValue(state as unknown as MenuState);
const renderPage = () =>
  render(
    <MemoryRouter>
      <MenuPage />
    </MemoryRouter>,
  );

const loaded = {
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
  data: {
    categories: [
      { id: "c1", nameEn: "Hot drinks", nameAm: null, sortOrder: 1 },
      { id: "c2", nameEn: "Cold drinks", nameAm: null, sortOrder: 2 },
    ],
    tags: [
      {
        id: "t1",
        slug: "fasting",
        group: "fasting",
        nameEn: "Fasting",
        nameAm: null,
      },
    ],
    items: [
      {
        id: "i1",
        categoryId: "c1",
        nameEn: "Macchiato",
        priceEtb: 55,
        isAvailable: true,
        tagIds: [],
      },
      {
        id: "i2",
        categoryId: "c1",
        nameEn: "Cappuccino",
        priceEtb: 70,
        isAvailable: false,
        tagIds: [],
      },
      {
        id: "i3",
        categoryId: "c2",
        nameEn: "Avocado juice",
        priceEtb: 90,
        isAvailable: true,
        tagIds: ["t1"],
      },
    ],
  },
};

beforeEach(() => vi.resetAllMocks());

describe("MenuPage states", () => {
  it("shows a loading placeholder while the menu loads", () => {
    mockMenu({
      isPending: true,
      isError: false,
      data: undefined,
      isFetching: true,
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByRole("status", { name: "Loading menu" })).toBeTruthy();
  });

  it("shows an error with a retry button", () => {
    const refetch = vi.fn();
    mockMenu({
      isPending: false,
      isError: true,
      data: undefined,
      isFetching: false,
      refetch,
    });
    renderPage();
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("lists items by category with ETB prices and marks unavailable ones", () => {
    mockMenu(loaded);
    renderPage();
    expect(screen.getByRole("heading", { name: "Hot drinks" })).toBeTruthy();
    expect(screen.getByText("ETB 55")).toBeTruthy();
    expect(screen.getByText("ETB 70")).toBeTruthy();
    expect(screen.getAllByText("Unavailable")).toHaveLength(1);
  });
});

describe("MenuPage filters", () => {
  it("filters by the search text", () => {
    mockMenu(loaded);
    renderPage();
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search the menu" }),
      { target: { value: "avocado" } },
    );
    expect(screen.queryByText("Macchiato")).toBeNull();
    expect(screen.getByText("Avocado juice")).toBeTruthy();
  });

  it("filters by a category and a tag chip", () => {
    mockMenu(loaded);
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Hot drinks" }));
    expect(screen.queryByText("Avocado juice")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    fireEvent.click(screen.getByRole("button", { name: "Fasting" }));
    expect(
      screen
        .getByRole("button", { name: "Fasting" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.queryByText("Macchiato")).toBeNull();
    expect(screen.getByText("Avocado juice")).toBeTruthy();
  });

  it("shows an empty state and clears the filters", () => {
    mockMenu(loaded);
    renderPage();
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search the menu" }),
      { target: { value: "zzzz" } },
    );
    expect(screen.getByText(/No items match/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("Macchiato")).toBeTruthy();
    expect(screen.queryByText(/No items match/)).toBeNull();
  });
});
