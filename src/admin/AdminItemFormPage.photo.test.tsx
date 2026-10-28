import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMenu } from "../api/useMenu";
import { prepareImage } from "../lib/imageResize";
import AdminRoutes from "./AdminRoutes";
import * as api from "./api";
import * as imagesApi from "./imagesApi";
import * as itemsApi from "./itemsApi";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  fetchSession: vi.fn(),
}));
vi.mock("./itemsApi");
vi.mock("./imagesApi");
vi.mock("../api/useMenu");
vi.mock("../lib/imageResize", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/imageResize")>()),
  prepareImage: vi.fn(),
}));

const categories = [
  {
    id: "c1",
    nameEn: "Hot drinks",
    nameAm: null,
    sortOrder: 1,
    isVisible: true,
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
  imagePath: "/api/images/old1",
  isAvailable: true,
  isFeatured: false,
  availableFrom: null,
  availableTo: null,
  tagIds: [],
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

describe("item form photo", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.fetchSession).mockResolvedValue({ email: "abebe@admin.com" });
    vi.mocked(itemsApi.fetchAdminCategories).mockResolvedValue(categories);
    vi.mocked(itemsApi.fetchAdminItems).mockResolvedValue([macchiato]);
    vi.mocked(itemsApi.createItem).mockResolvedValue(macchiato);
    vi.mocked(itemsApi.updateItem).mockResolvedValue(macchiato);
    vi.mocked(useMenu).mockReturnValue({
      data: { categories: [], items: [], tags: [] },
      isError: false,
      isPending: false,
    } as unknown as ReturnType<typeof useMenu>);
    vi.mocked(prepareImage).mockResolvedValue(new Blob(["webp"]));
    vi.mocked(imagesApi.uploadImage).mockResolvedValue("/api/images/new1");
  });

  it("saves a new item with the uploaded photo", async () => {
    const user = userEvent.setup();
    renderAt("/admin/items/new");
    await user.selectOptions(await screen.findByLabelText("Category"), "c1");
    await user.type(screen.getByLabelText("Name (English)"), "Latte");
    await user.type(screen.getByLabelText("Price (ETB)"), "60");
    await user.upload(
      screen.getByLabelText("Photo"),
      new File(["x"], "latte.jpg", { type: "image/jpeg" }),
    );
    expect(await screen.findByText(/Photo ready/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(itemsApi.createItem).toHaveBeenCalledWith(
      expect.objectContaining({
        nameEn: "Latte",
        imagePath: "/api/images/new1",
      }),
    );
  });

  it("shows the current photo when editing, and removes it on save", async () => {
    const user = userEvent.setup();
    renderAt("/admin/items/i1/edit");
    expect(
      await screen.findByAltText("Photo of Macchiato"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove photo" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(itemsApi.updateItem).toHaveBeenCalledWith(
      "i1",
      expect.objectContaining({ imagePath: null }),
    );
  });

  it("keeps the photo when it is left alone", async () => {
    const user = userEvent.setup();
    renderAt("/admin/items/i1/edit");
    await screen.findByAltText("Photo of Macchiato");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(itemsApi.updateItem).toHaveBeenCalledWith(
      "i1",
      expect.objectContaining({ imagePath: "/api/images/old1" }),
    );
  });
});
