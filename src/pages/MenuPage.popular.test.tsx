import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMenu } from "../api/useMenu";
import MenuPage from "./MenuPage";

vi.mock("../api/useMenu");

type MenuState = ReturnType<typeof useMenu>;

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.mocked(useMenu).mockReturnValue({
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    data: {
      categories: [
        { id: "c1", nameEn: "Hot drinks", nameAm: null, sortOrder: 1 },
      ],
      tags: [
        {
          id: "t1",
          slug: "hot",
          group: "temperature",
          nameEn: "Hot",
          nameAm: null,
        },
      ],
      items: [
        {
          id: "i1",
          categoryId: "c1",
          nameEn: "Macchiato",
          nameAm: null,
          descriptionEn: null,
          descriptionAm: null,
          priceEtb: 55,
          isAvailable: true,
          isFeatured: true,
          tagIds: ["t1"],
        },
        {
          id: "i2",
          categoryId: "c1",
          nameEn: "Cappuccino",
          nameAm: null,
          descriptionEn: null,
          descriptionAm: null,
          priceEtb: 70,
          isAvailable: true,
          isFeatured: false,
          tagIds: [],
        },
      ],
    },
  } as unknown as MenuState);
  render(
    <MemoryRouter>
      <MenuPage />
    </MemoryRouter>,
  );
});

describe("MenuPage popular section and badges", () => {
  it("shows featured items under Popular as well as in their category", () => {
    expect(
      screen.getByRole("heading", { level: 2, name: "Popular" }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { level: 3, name: "Macchiato" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("heading", { level: 3, name: "Cappuccino" }),
    ).toHaveLength(1);
  });

  it("hides Popular while a filter is active", () => {
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search the menu" }),
      { target: { value: "capp" } },
    );
    expect(
      screen.queryByRole("heading", { level: 2, name: "Popular" }),
    ).toBeNull();
  });

  it("shows tag badges on the card", () => {
    const card = screen
      .getAllByRole("heading", { level: 3, name: "Macchiato" })[0]
      .closest("li");
    expect(within(card as HTMLElement).getByText("Hot")).toBeTruthy();
  });
});
