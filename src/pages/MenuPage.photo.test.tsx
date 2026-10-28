import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMenu } from "../api/useMenu";
import { photoUrl } from "../lib/photoUrl";
import MenuPage from "./MenuPage";

vi.mock("../api/useMenu");

type MenuState = ReturnType<typeof useMenu>;

const base = {
  categoryId: "c1",
  nameAm: null,
  descriptionEn: null,
  descriptionAm: null,
  priceEtb: 55,
  isAvailable: true,
  isFeatured: false,
  tagIds: [],
};

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
      tags: [],
      items: [
        {
          ...base,
          id: "i1",
          nameEn: "Macchiato",
          imagePath: "/api/images/abc",
        },
        { ...base, id: "i2", nameEn: "Cappuccino", imagePath: null },
      ],
    },
  } as unknown as MenuState);
  render(
    <MemoryRouter>
      <MenuPage />
    </MemoryRouter>,
  );
});

describe("MenuPage item photos", () => {
  it("shows the uploaded photo for an item that has one", () => {
    const photos = document.querySelectorAll<HTMLImageElement>(
      "img.menu-card-photo",
    );
    const sources = Array.from(photos).map((img) => img.getAttribute("src"));
    expect(sources).toContain(photoUrl("/api/images/abc"));
  });

  it("keeps the placeholder photo for an item without one", () => {
    expect(screen.getByRole("heading", { name: "Cappuccino" })).toBeTruthy();
    const sources = Array.from(
      document.querySelectorAll<HTMLImageElement>("img.menu-card-photo"),
    ).map((img) => img.getAttribute("src"));
    expect(
      sources.filter((s) => s !== photoUrl("/api/images/abc")),
    ).not.toHaveLength(0);
  });
});
