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

beforeEach(() => vi.resetAllMocks());

describe("MenuPage", () => {
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
    mockMenu({
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
            priceEtb: 55,
            isAvailable: true,
          },
          {
            id: "i2",
            categoryId: "c1",
            nameEn: "Cappuccino",
            priceEtb: 70,
            isAvailable: false,
          },
        ],
      },
    });
    renderPage();
    expect(screen.getByRole("heading", { name: "Hot drinks" })).toBeTruthy();
    expect(screen.getByText("ETB 55")).toBeTruthy();
    expect(screen.getByText("ETB 70")).toBeTruthy();
    expect(screen.getAllByText("Unavailable")).toHaveLength(1);
  });
});
