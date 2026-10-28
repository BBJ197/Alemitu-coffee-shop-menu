import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminRoutes from "./AdminRoutes";
import * as api from "./api";
import * as categoriesApi from "./categoriesApi";
import * as itemsApi from "./itemsApi";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  fetchSession: vi.fn(),
}));
vi.mock("./itemsApi");
vi.mock("./categoriesApi");

const hot = {
  id: "c1",
  nameEn: "Hot drinks",
  nameAm: null,
  sortOrder: 1,
  isVisible: true,
  itemCount: 3,
};
const cold = {
  id: "c2",
  nameEn: "Cold drinks",
  nameAm: "ቀዝቃዛ",
  sortOrder: 2,
  isVisible: false,
  itemCount: 0,
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/admin/categories"]}>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("admin categories page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.fetchSession).mockResolvedValue({ email: "abebe@admin.com" });
    vi.mocked(itemsApi.fetchAdminCategories).mockResolvedValue([hot, cold]);
    vi.mocked(categoriesApi.createCategory).mockResolvedValue(hot);
    vi.mocked(categoriesApi.updateCategory).mockResolvedValue(hot);
    vi.mocked(categoriesApi.reorderCategories).mockResolvedValue([cold, hot]);
    vi.mocked(categoriesApi.deleteCategory).mockResolvedValue(undefined);
  });

  it("lists categories with item counts and marks hidden ones", async () => {
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "Categories" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hot drinks")).toBeInTheDocument();
    expect(screen.getByText("3 items")).toBeInTheDocument();
    expect(screen.getByText("0 items")).toBeInTheDocument();
    expect(screen.getByText("Hidden from customers")).toBeInTheDocument();
  });

  it("explains an empty name and sends nothing", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Add category" }),
    );
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(categoriesApi.createCategory).not.toHaveBeenCalled();
  });

  it("adds a category and confirms it", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(
      await screen.findByLabelText("New category name (English)"),
      "  Snacks ",
    );
    await user.click(screen.getByRole("button", { name: "Add category" }));
    expect(await screen.findByText('Added "Snacks".')).toBeInTheDocument();
    expect(categoriesApi.createCategory).toHaveBeenCalledWith({
      nameEn: "Snacks",
      nameAm: "",
      isVisible: true,
    });
  });

  it("shows the server's message when the name is rejected", async () => {
    vi.mocked(categoriesApi.createCategory).mockRejectedValue(
      new api.AdminApiError(400, "validation_failed", {
        nameEn: ["Name is required"],
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.type(
      await screen.findByLabelText("New category name (English)"),
      "x",
    );
    await user.click(screen.getByRole("button", { name: "Add category" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Name is required",
    );
  });

  it("renames a category", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Rename: Hot drinks" }),
    );
    const input = screen.getByLabelText("Name (English)");
    await user.clear(input);
    await user.type(input, "Coffee");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText('Saved "Coffee".')).toBeInTheDocument();
    expect(categoriesApi.updateCategory).toHaveBeenCalledWith("c1", {
      nameEn: "Coffee",
      nameAm: "",
      isVisible: true,
    });
  });

  it("hides a visible category and shows a hidden one", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Hide: Hot drinks" }),
    );
    expect(categoriesApi.updateCategory).toHaveBeenLastCalledWith("c1", {
      nameEn: "Hot drinks",
      nameAm: "",
      isVisible: false,
    });
    await user.click(
      await screen.findByRole("button", { name: "Show: Cold drinks" }),
    );
    expect(categoriesApi.updateCategory).toHaveBeenLastCalledWith("c2", {
      nameEn: "Cold drinks",
      nameAm: "ቀዝቃዛ",
      isVisible: true,
    });
  });

  it("moves a category down, and disables moves at the ends", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(
      await screen.findByRole("button", { name: "Move up: Hot drinks" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move down: Cold drinks" }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Move down: Hot drinks" }),
    );
    expect(categoriesApi.reorderCategories).toHaveBeenCalledWith(["c2", "c1"]);
  });

  it("asks before deleting an empty category, and Cancel changes nothing", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Delete: Cold drinks" }),
    );
    const group = screen.getByRole("group", {
      name: "Confirm deleting Cold drinks",
    });
    await user.click(within(group).getByRole("button", { name: "Cancel" }));
    expect(categoriesApi.deleteCategory).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Delete: Cold drinks" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete category" }));
    expect(categoriesApi.deleteCategory).toHaveBeenCalledWith("c2");
    expect(
      await screen.findByText('Deleted "Cold drinks".'),
    ).toBeInTheDocument();
  });

  it("warns instead of deleting a category that still has items", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Delete: Hot drinks" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "It still has 3 items. Move or delete them first.",
    );
    expect(
      screen.queryByRole("button", { name: "Delete category" }),
    ).not.toBeInTheDocument();
    expect(categoriesApi.deleteCategory).not.toHaveBeenCalled();
  });

  it("explains it when the server says the category is in use", async () => {
    vi.mocked(categoriesApi.deleteCategory).mockRejectedValue(
      new api.AdminApiError(409, "category_in_use"),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Delete: Cold drinks" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete category" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Move or delete them first.",
    );
  });
});
