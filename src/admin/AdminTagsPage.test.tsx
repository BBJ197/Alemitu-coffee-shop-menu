import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminRoutes from "./AdminRoutes";
import * as api from "./api";
import * as tagsApi from "./tagsApi";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  fetchSession: vi.fn(),
}));
vi.mock("./tagsApi");

const hot = {
  id: "t1",
  slug: "hot",
  group: "temperature" as const,
  nameEn: "Hot",
  nameAm: null,
  sortOrder: 1,
  itemCount: 4,
};
const cold = {
  ...hot,
  id: "t2",
  slug: "cold",
  nameEn: "Cold",
  sortOrder: 2,
  itemCount: 0,
};
const veg = {
  ...hot,
  id: "t3",
  slug: "vegetarian",
  group: "diet" as const,
  nameEn: "Vegetarian",
  sortOrder: 1,
  itemCount: 2,
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/admin/tags"]}>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("admin tags page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.fetchSession).mockResolvedValue({ email: "abebe@admin.com" });
    vi.mocked(tagsApi.fetchAdminTags).mockResolvedValue([hot, cold, veg]);
    vi.mocked(tagsApi.createTag).mockResolvedValue(hot);
    vi.mocked(tagsApi.updateTag).mockResolvedValue(hot);
    vi.mocked(tagsApi.reorderTags).mockResolvedValue([cold, hot, veg]);
    vi.mocked(tagsApi.deleteTag).mockResolvedValue(undefined);
  });

  it("lists tags by group with how many items use each", async () => {
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "Tags" }),
    ).toBeInTheDocument();
    const temperature = screen.getByRole("region", { name: "Temperature" });
    expect(within(temperature).getByText("Hot")).toBeInTheDocument();
    expect(within(temperature).getByText("4 items")).toBeInTheDocument();
    expect(within(temperature).getByText("0 items")).toBeInTheDocument();
    const diet = screen.getByRole("region", { name: "Diet" });
    expect(within(diet).getByText("Vegetarian")).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Fasting" })).getByText(
        "No tags in this group.",
      ),
    ).toBeInTheDocument();
  });

  it("explains an empty name and sends nothing", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: "Add tag" }));
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(tagsApi.createTag).not.toHaveBeenCalled();
  });

  it("adds a tag to the chosen group and confirms it", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(await screen.findByLabelText("Group"), "diet");
    await user.type(screen.getByLabelText("New tag name (English)"), " Spicy ");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    expect(await screen.findByText('Added "Spicy".')).toBeInTheDocument();
    expect(tagsApi.createTag).toHaveBeenCalledWith({
      group: "diet",
      nameEn: "Spicy",
      nameAm: "",
    });
  });

  it("shows the server's message for a duplicate name", async () => {
    vi.mocked(tagsApi.createTag).mockRejectedValue(
      new api.AdminApiError(400, "validation_failed", {
        nameEn: ["A tag with this name already exists"],
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.type(
      await screen.findByLabelText("New tag name (English)"),
      "Hot",
    );
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A tag with this name already exists",
    );
  });

  it("renames a tag", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Rename: Hot" }),
    );
    const input = screen.getByLabelText("Name (English)");
    await user.clear(input);
    await user.type(input, "Piping hot");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText('Saved "Piping hot".')).toBeInTheDocument();
    expect(tagsApi.updateTag).toHaveBeenCalledWith("t1", {
      nameEn: "Piping hot",
      nameAm: "",
    });
  });

  it("reorders within a group and disables moves at the ends", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(
      await screen.findByRole("button", { name: "Move up: Hot" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move down: Cold" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move up: Vegetarian" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move down: Vegetarian" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Move down: Hot" }));
    expect(tagsApi.reorderTags).toHaveBeenCalledWith(["t2", "t1"]);
  });

  it("warns how many items lose the tag, then deletes it", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Delete: Hot" }),
    );
    const group = screen.getByRole("group", { name: "Confirm deleting Hot" });
    expect(group).toHaveTextContent("It will be removed from 4 items.");
    await user.click(within(group).getByRole("button", { name: "Cancel" }));
    expect(tagsApi.deleteTag).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete: Hot" }));
    await user.click(screen.getByRole("button", { name: "Delete tag" }));
    expect(tagsApi.deleteTag).toHaveBeenCalledWith("t1");
    expect(await screen.findByText('Deleted "Hot".')).toBeInTheDocument();
  });

  it("does not mention items when nothing uses the tag, and Escape cancels", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Delete: Cold" }),
    );
    const group = screen.getByRole("group", { name: "Confirm deleting Cold" });
    expect(group).not.toHaveTextContent("removed from");
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("group", { name: "Confirm deleting Cold" }),
    ).not.toBeInTheDocument();
    expect(tagsApi.deleteTag).not.toHaveBeenCalled();
  });
});
