import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminHome from "./AdminHome";
import * as itemsApi from "./itemsApi";

vi.mock("./itemsApi");

const categories = [
  {
    id: "c1",
    nameEn: "Hot drinks",
    nameAm: null,
    sortOrder: 1,
    isVisible: true,
  },
  {
    id: "c2",
    nameEn: "Seasonal",
    nameAm: null,
    sortOrder: 2,
    isVisible: false,
  },
];

const item = (id: string, over: Partial<itemsApi.AdminItem> = {}) => ({
  id,
  categoryId: "c1",
  nameEn: id,
  nameAm: null,
  descriptionEn: null,
  descriptionAm: null,
  priceEtb: 50,
  imagePath: "/api/images/x",
  isAvailable: true,
  isFeatured: false,
  availableFrom: null,
  availableTo: null,
  tagIds: [],
  ...over,
});

function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminHome />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const stat = (label: string) => {
  const term = screen.getByText(label, { selector: "dt" });
  return within(term.parentElement as HTMLElement).getByText(/^\d+$/);
};

describe("admin dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(itemsApi.fetchAdminCategories).mockResolvedValue(categories);
    vi.mocked(itemsApi.fetchAdminItems).mockResolvedValue([
      item("Macchiato"),
      item("Latte", { isAvailable: false }),
      item("Tibs", { isFeatured: true, imagePath: null, categoryId: "c2" }),
    ]);
  });

  it("shows counts for the menu", async () => {
    renderHome();
    expect(
      await screen.findByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    await screen.findByText("Needs attention");
    expect(stat("Items")).toHaveTextContent("3");
    expect(stat("Available")).toHaveTextContent("2");
    expect(stat("Unavailable")).toHaveTextContent("1");
    expect(stat("Popular")).toHaveTextContent("1");
    expect(stat("Without a photo")).toHaveTextContent("1");
    expect(stat("Categories")).toHaveTextContent("2");
    expect(stat("Hidden categories")).toHaveTextContent("1");
  });

  it("lists unavailable items with a link to edit each one", async () => {
    renderHome();
    const link = await screen.findByRole("link", { name: "Latte" });
    expect(link).toHaveAttribute("href", "/admin/items/Latte/edit");
    expect(
      screen.getByText(/1 item is marked unavailable/),
    ).toBeInTheDocument();
  });

  it("warns about items in a hidden category", async () => {
    renderHome();
    expect(
      await screen.findByText(/1 item is in a hidden category/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review categories" }),
    ).toHaveAttribute("href", "/admin/categories");
  });

  it("says nothing needs attention when all is well", async () => {
    vi.mocked(itemsApi.fetchAdminItems).mockResolvedValue([item("Macchiato")]);
    vi.mocked(itemsApi.fetchAdminCategories).mockResolvedValue([
      categories[0]!,
    ]);
    renderHome();
    expect(
      await screen.findByText("Nothing needs attention right now."),
    ).toBeInTheDocument();
  });

  it("offers quick links", async () => {
    renderHome();
    expect(
      await screen.findByRole("link", { name: "Add an item" }),
    ).toHaveAttribute("href", "/admin/items/new");
    expect(
      screen.getByRole("link", { name: "Print the QR code" }),
    ).toHaveAttribute("href", "/admin/qr");
  });

  it("shows a retry when the summary cannot load", async () => {
    vi.mocked(itemsApi.fetchAdminItems).mockRejectedValueOnce(
      new Error("offline"),
    );
    const user = userEvent.setup();
    renderHome();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't load the summary",
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Needs attention")).toBeInTheDocument();
  });
});
