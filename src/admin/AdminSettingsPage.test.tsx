import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminRoutes from "./AdminRoutes";
import * as api from "./api";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  fetchSession: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  changePassword: vi.fn(),
}));

function renderSettings() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/admin/settings"]}>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const OLD = "old-password-123";
const NEW = "new-password-1234";

async function submit(current: string, next: string, confirm: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Current password"), current);
  await user.type(screen.getByLabelText("New password"), next);
  await user.type(screen.getByLabelText("Confirm new password"), confirm);
  await user.click(screen.getByRole("button", { name: "Change password" }));
}

describe("account settings", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.fetchSession).mockResolvedValue({ email: "abebe@admin.com" });
  });

  it("explains a mismatched confirmation and sends nothing", async () => {
    renderSettings();
    await submit(OLD, NEW, "something-else-123");
    expect(await screen.findByRole("alert")).toHaveTextContent("don't match");
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it("explains a too-short password and sends nothing", async () => {
    renderSettings();
    await submit(OLD, "short", "short");
    expect(await screen.findByRole("alert")).toHaveTextContent("at least 12");
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it("shows the server's wrong-current-password error", async () => {
    vi.mocked(api.changePassword).mockRejectedValue(
      new api.AdminApiError(403, "wrong_current_password"),
    );
    renderSettings();
    await submit("wrong-password-xx", NEW, NEW);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The current password is incorrect.",
    );
  });

  it("confirms the change and clears the form", async () => {
    vi.mocked(api.changePassword).mockResolvedValue();
    renderSettings();
    await submit(OLD, NEW, NEW);
    expect(
      await screen.findByText(
        "Password changed. Other devices have been signed out.",
      ),
    ).toBeInTheDocument();
    expect(api.changePassword).toHaveBeenCalledWith(OLD, NEW);
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password")).toHaveValue("");
  });

  it("returns to sign-in when the session has expired", async () => {
    vi.mocked(api.changePassword).mockRejectedValue(
      new api.AdminApiError(401, "unauthorized"),
    );
    renderSettings();
    await submit(OLD, NEW, NEW);
    expect(
      await screen.findByRole("heading", { name: "Staff sign-in" }),
    ).toBeInTheDocument();
  });
});
