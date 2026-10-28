import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminRoutes from "./AdminRoutes";
import * as api from "./api";
import * as itemsApi from "./itemsApi";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  fetchSession: vi.fn(),
}));
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
    nameEn: "Cold drinks",
    nameAm: null,
    sortOrder: 2,
    isVisible: false,
  },
];
const macchiato = {
  id: "i1",
  categoryId: "c1",
  nameEn: "Macchiato",
  nameAm: null,
  descriptionEn: null,
  descriptionAm: null,
  priceEtb: 55,
  imagePath: null,
  isAvailable: true,
  isFeatured: true,
  availableFrom: null,
  availableTo: null,
  tagIds: [],
};
const iced = {
  ...macchiato,
  id: "i2",
  categoryId: "c2",
  nameEn: "Iced coffee",
  priceEtb: 85.5,
  isAvailable: false,
  isFeatured: false,
  availableFrom: "06:00:00",
  availableTo: "11:00:00",
};

function renderItems() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/admin/items"]}>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("admin items page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.fetchSession).mockResolvedValue({ email: "abebe@admin.com" });
    vi.mocked(itemsApi.fetchAdminItems).mockResolvedValue([macchiato, iced]);
    vi.mocked(itemsApi.fetchAdminCategories).mockResolvedValue(categories);
  });

  it("groups items by category and shows price, status and schedule", async () => {
    renderItems();
    expect(
      await screen.findByRole("heading", { name: /Hot drinks/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Cold drinks/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hidden from customers")).toBeInTheDocument();
    expect(screen.getByText("Macchiato")).toBeInTheDocument();
    expect(screen.getByText("ETB 55")).toBeInTheDocument();
    expect(screen.getByText("ETB 85.50")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.getByText("Popular")).toBeInTheDocument();
    expect(screen.getByText("Served 06:00–11:00")).toBeInTheDocument();
  });

  it("says so when there are no items", async () => {
    vi.mocked(itemsApi.fetchAdminItems).mockResolvedValue([]);
    renderItems();
    expect(
      await screen.findByText("There are no menu items yet."),
    ).toBeInTheDocument();
  });

  it("shows an error and loads again on Try again", async () => {
    vi.mocked(itemsApi.fetchAdminItems)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue([macchiato]);
    const user = userEvent.setup();
    renderItems();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't load the menu items.",
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Macchiato")).toBeInTheDocument();
  });

  it("toggles availability", async () => {
    vi.mocked(itemsApi.setItemAvailability).mockResolvedValue({
      ...macchiato,
      isAvailable: false,
    });
    const user = userEvent.setup();
    renderItems();
    await user.click(
      await screen.findByRole("button", {
        name: "Mark unavailable: Macchiato",
      }),
    );
    expect(itemsApi.setItemAvailability).toHaveBeenCalledWith("i1", false);
    expect(
      await screen.findByRole("button", { name: "Mark available: Macchiato" }),
    ).toBeInTheDocument();
  });

  it("asks before deleting, and Cancel and Escape change nothing", async () => {
    const user = userEvent.setup();
    renderItems();
    await user.click(
      await screen.findByRole("button", { name: "Delete: Macchiato" }),
    );
    expect(screen.getByText(/Delete "Macchiato"\?/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText(/Delete "Macchiato"\?/)).toBeNull();
    expect(
      screen.getByRole("button", { name: "Delete: Macchiato" }),
    ).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Delete: Macchiato" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByText(/Delete "Macchiato"\?/)).toBeNull();
    expect(itemsApi.deleteItem).not.toHaveBeenCalled();
  });

  it("deletes after confirmation and removes the row", async () => {
    vi.mocked(itemsApi.deleteItem).mockResolvedValue();
    const user = userEvent.setup();
    renderItems();
    await user.click(
      await screen.findByRole("button", { name: "Delete: Macchiato" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete item" }));
    expect(itemsApi.deleteItem).toHaveBeenCalledWith("i1");
    await waitFor(() => expect(screen.queryByText("Macchiato")).toBeNull());
    expect(screen.getByText("Iced coffee")).toBeInTheDocument();
  });

  it("keeps the row and says so when deleting fails", async () => {
    vi.mocked(itemsApi.deleteItem).mockRejectedValue(
      new api.AdminApiError(500, null),
    );
    const user = userEvent.setup();
    renderItems();
    await user.click(
      await screen.findByRole("button", { name: "Delete: Macchiato" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete item" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't delete the item.",
    );
    expect(screen.getByText("Macchiato")).toBeInTheDocument();
  });

  it("returns to sign-in when the session has expired", async () => {
    vi.mocked(itemsApi.fetchAdminItems).mockRejectedValue(
      new api.AdminApiError(401, "unauthorized"),
    );
    renderItems();
    expect(
      await screen.findByRole("heading", { name: "Staff sign-in" }),
    ).toBeInTheDocument();
  });
});

describe("admin items filters and links", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.fetchSession).mockResolvedValue({ email: "abebe@admin.com" });
    vi.mocked(itemsApi.fetchAdminItems).mockResolvedValue([macchiato, iced]);
    vi.mocked(itemsApi.fetchAdminCategories).mockResolvedValue(categories);
  });

  it("searches by name and shows how many match", async () => {
    const user = userEvent.setup();
    renderItems();
    await user.type(await screen.findByLabelText("Search items"), "iced");
    expect(screen.getByText("Iced coffee")).toBeInTheDocument();
    expect(screen.queryByText("Macchiato")).toBeNull();
    expect(screen.getByText("Showing 1 of 2 items.")).toBeInTheDocument();
  });

  it("searches by category name", async () => {
    const user = userEvent.setup();
    renderItems();
    await user.type(await screen.findByLabelText("Search items"), "hot");
    expect(screen.getByText("Macchiato")).toBeInTheDocument();
    expect(screen.queryByText("Iced coffee")).toBeNull();
  });

  it("filters by status", async () => {
    const user = userEvent.setup();
    renderItems();
    await user.selectOptions(
      await screen.findByLabelText("Show"),
      "Only unavailable",
    );
    expect(screen.getByText("Iced coffee")).toBeInTheDocument();
    expect(screen.queryByText("Macchiato")).toBeNull();
  });

  it("combines filters, shows an empty state and clears them", async () => {
    const user = userEvent.setup();
    renderItems();
    await user.type(await screen.findByLabelText("Search items"), "macchiato");
    await user.selectOptions(screen.getByLabelText("Show"), "Only unavailable");
    expect(
      screen.getByText("No items match your filters."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("Macchiato")).toBeInTheDocument();
    expect(screen.getByText("Iced coffee")).toBeInTheDocument();
    expect(screen.getByLabelText("Search items")).toHaveValue("");
  });

  it("links to the add and edit forms", async () => {
    renderItems();
    expect(
      await screen.findByRole("link", { name: "Add item" }),
    ).toHaveAttribute("href", "/admin/items/new");
    expect(
      screen.getByRole("link", { name: "Edit: Macchiato" }),
    ).toHaveAttribute("href", "/admin/items/i1/edit");
  });
});
