import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMenu } from "../api/useMenu";
import AdminRoutes from "./AdminRoutes";
import * as api from "./api";
import * as itemsApi from "./itemsApi";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  fetchSession: vi.fn(),
}));
vi.mock("./itemsApi");
vi.mock("../api/useMenu");

const categories = [
  {
    id: "c1",
    nameEn: "Hot drinks",
    nameAm: null,
    sortOrder: 1,
    isVisible: true,
  },
  { id: "c2", nameEn: "Food", nameAm: null, sortOrder: 2, isVisible: true },
];
const tags = [
  {
    id: "t1",
    slug: "hot",
    group: "temperature" as const,
    nameEn: "Hot",
    nameAm: null,
  },
  {
    id: "t2",
    slug: "fasting",
    group: "fasting" as const,
    nameEn: "Fasting",
    nameAm: null,
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
  imagePath: "photos/mac.webp",
  isAvailable: true,
  isFeatured: false,
  availableFrom: "06:00:00",
  availableTo: "11:00:00",
  tagIds: ["t1"],
};

function renderAt(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("add and edit item form", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.fetchSession).mockResolvedValue({ email: "abebe@admin.com" });
    vi.mocked(itemsApi.fetchAdminItems).mockResolvedValue([macchiato]);
    vi.mocked(itemsApi.fetchAdminCategories).mockResolvedValue(categories);
    vi.mocked(useMenu).mockReturnValue({
      data: { categories: [], items: [], tags },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useMenu>);
  });

  it("explains missing fields and sends nothing", async () => {
    const user = userEvent.setup();
    renderAt("/admin/items/new");
    await user.click(await screen.findByRole("button", { name: "Add item" }));
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Price is required")).toBeInTheDocument();
    expect(screen.getByText("Choose a category")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Fix the highlighted fields",
    );
    expect(itemsApi.createItem).not.toHaveBeenCalled();
  });

  it("needs both serving times or neither", async () => {
    const user = userEvent.setup();
    renderAt("/admin/items/new");
    fireEvent.change(await screen.findByLabelText("Served from"), {
      target: { value: "06:00" },
    });
    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(
      await screen.findByText("Set both times or neither"),
    ).toBeInTheDocument();
  });

  it("creates an item, then returns to the list with a confirmation", async () => {
    vi.mocked(itemsApi.createItem).mockResolvedValue(macchiato);
    const user = userEvent.setup();
    renderAt("/admin/items/new");
    await user.selectOptions(await screen.findByLabelText("Category"), "c1");
    await user.type(screen.getByLabelText("Name (English)"), "Macchiato");
    await user.type(screen.getByLabelText("Price (ETB)"), "55.50");
    await user.click(screen.getByRole("checkbox", { name: "Hot" }));
    await user.click(screen.getByRole("button", { name: "Add item" }));

    expect(itemsApi.createItem).toHaveBeenCalledWith({
      categoryId: "c1",
      nameEn: "Macchiato",
      nameAm: "",
      descriptionEn: "",
      descriptionAm: "",
      priceEtb: 55.5,
      imagePath: null,
      isAvailable: true,
      isFeatured: false,
      availableFrom: null,
      availableTo: null,
      tagIds: ["t1"],
    });
    expect(
      await screen.findByRole("heading", { name: "Menu items" }),
    ).toBeInTheDocument();
    expect(screen.getByText('Saved "Macchiato".')).toBeInTheDocument();
  });

  it("shows the server's field messages", async () => {
    vi.mocked(itemsApi.createItem).mockRejectedValue(
      new api.AdminApiError(400, "validation_failed", {
        priceEtb: ["Price must be greater than 0"],
      }),
    );
    const user = userEvent.setup();
    renderAt("/admin/items/new");
    await user.selectOptions(await screen.findByLabelText("Category"), "c1");
    await user.type(screen.getByLabelText("Name (English)"), "Macchiato");
    await user.type(screen.getByLabelText("Price (ETB)"), "5");
    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(
      await screen.findByText("Price must be greater than 0"),
    ).toBeInTheDocument();
  });

  it("fills the form when editing, and keeps the photo on save", async () => {
    vi.mocked(itemsApi.updateItem).mockResolvedValue(macchiato);
    const user = userEvent.setup();
    renderAt("/admin/items/i1/edit");
    const name = await screen.findByLabelText("Name (English)");
    expect(name).toHaveValue("Macchiato");
    expect(screen.getByLabelText("Price (ETB)")).toHaveValue("55");
    expect(screen.getByLabelText("Served from")).toHaveValue("06:00");
    expect(screen.getByRole("checkbox", { name: "Hot" })).toBeChecked();

    await user.clear(name);
    await user.type(name, "Macchiato 2");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(itemsApi.updateItem).toHaveBeenCalledWith(
      "i1",
      expect.objectContaining({
        nameEn: "Macchiato 2",
        priceEtb: 55,
        imagePath: "photos/mac.webp",
        availableFrom: "06:00",
        tagIds: ["t1"],
      }),
    );
  });

  it("says so when the item does not exist", async () => {
    renderAt("/admin/items/missing/edit");
    expect(
      await screen.findByRole("heading", { name: "Item not found" }),
    ).toBeInTheDocument();
  });

  it("returns to sign-in when the session has expired", async () => {
    vi.mocked(itemsApi.fetchAdminItems).mockRejectedValue(
      new api.AdminApiError(401, "unauthorized"),
    );
    renderAt("/admin/items/new");
    expect(
      await screen.findByRole("heading", { name: "Staff sign-in" }),
    ).toBeInTheDocument();
  });
});
