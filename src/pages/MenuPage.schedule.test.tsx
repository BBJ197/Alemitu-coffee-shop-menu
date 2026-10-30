import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMenu } from "../api/useMenu";
import MenuPage from "./MenuPage";

vi.mock("../api/useMenu");

type MenuState = ReturnType<typeof useMenu>;

const base = {
  categoryId: "c1",
  nameAm: null,
  descriptionEn: null,
  descriptionAm: null,
  priceEtb: 55,
  imagePath: null,
  isAvailable: true,
  isFeatured: false,
  tagIds: [],
  availableFrom: null,
  availableTo: null,
};

const items = [
  {
    ...base,
    id: "i1",
    nameEn: "Eggs",
    availableFrom: "06:00:00",
    availableTo: "11:00:00",
    isFeatured: true,
  },
  { ...base, id: "i2", nameEn: "Macchiato" },
  {
    ...base,
    id: "i3",
    nameEn: "Night soup",
    availableFrom: "18:00:00",
    availableTo: "02:00:00",
  },
];

// 06:00 in Addis Ababa is 03:00 UTC.
const at = (hhmm: string) => new Date(`2026-10-30T${hhmm}:00Z`);

function renderMenu() {
  vi.mocked(useMenu).mockReturnValue({
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    data: {
      categories: [{ id: "c1", nameEn: "Food", nameAm: null, sortOrder: 1 }],
      tags: [],
      items,
    },
  } as unknown as MenuState);
  return render(
    <MemoryRouter>
      <MenuPage />
    </MemoryRouter>,
  );
}

const card = (name: string) =>
  screen.getAllByRole("heading", { name })[0]!.closest("li") as HTMLElement;

describe("MenuPage schedules", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("serves a scheduled item normally during its hours", () => {
    vi.setSystemTime(at("05:00")); // 08:00 in Addis Ababa
    renderMenu();
    expect(card("Eggs")).not.toHaveClass("is-unavailable");
    expect(screen.queryByText(/Served 06:00–11:00/)).not.toBeInTheDocument();
  });

  it("dims a scheduled item outside its hours and says when it is served", () => {
    vi.setSystemTime(at("11:00")); // 14:00 in Addis Ababa
    renderMenu();
    const eggs = card("Eggs");
    expect(eggs).toHaveClass("is-unavailable");
    expect(eggs).toHaveTextContent("Served 06:00–11:00");
    expect(card("Macchiato")).not.toHaveClass("is-unavailable");
  });

  it("uses Addis Ababa time, not the device's", () => {
    vi.setSystemTime(at("21:30")); // 00:30 in Addis Ababa
    renderMenu();
    expect(card("Night soup")).not.toHaveClass("is-unavailable");
    expect(card("Eggs")).toHaveClass("is-unavailable");
  });

  it("keeps an off-hours item out of the Popular section", () => {
    vi.setSystemTime(at("05:00"));
    const { unmount } = renderMenu();
    expect(screen.getAllByRole("heading", { name: "Eggs" })).toHaveLength(2);
    unmount();
    vi.setSystemTime(at("11:00"));
    renderMenu();
    expect(screen.getAllByRole("heading", { name: "Eggs" })).toHaveLength(1);
  });

  it("updates while the page stays open", () => {
    vi.setSystemTime(at("07:59")); // 10:59 in Addis Ababa
    renderMenu();
    expect(card("Eggs")).not.toHaveClass("is-unavailable");
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(card("Eggs")).toHaveClass("is-unavailable");
  });

  it("explains the hours in Amharic when that language is chosen", () => {
    localStorage.setItem("alemitu-lang", "am");
    vi.setSystemTime(at("11:00"));
    renderMenu();
    expect(card("Eggs")).toHaveTextContent("የሚቀርበው 06:00–11:00");
  });
});
