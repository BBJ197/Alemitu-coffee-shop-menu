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
}));

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

const signInHeading = () =>
  screen.findByRole("heading", { name: "Staff sign-in" });
const dashboardHeading = () =>
  screen.findByRole("heading", { name: "Dashboard" });

describe("admin routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("sends a signed-out visitor from /admin to the login page", async () => {
    vi.mocked(api.fetchSession).mockResolvedValue(null);
    renderAt("/admin");
    expect(await signInHeading()).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Dashboard" })).toBeNull();
  });

  it("shows the dashboard and the admin's email when signed in", async () => {
    vi.mocked(api.fetchSession).mockResolvedValue({ email: "abebe@admin.com" });
    renderAt("/admin");
    expect(await dashboardHeading()).toBeInTheDocument();
    expect(screen.getByText("abebe@admin.com")).toBeInTheDocument();
  });

  it("skips the login page when already signed in", async () => {
    vi.mocked(api.fetchSession).mockResolvedValue({ email: "abebe@admin.com" });
    renderAt("/admin/login");
    expect(await dashboardHeading()).toBeInTheDocument();
  });

  it("shows a retry, not the login page, when the session check fails", async () => {
    vi.mocked(api.fetchSession).mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    renderAt("/admin");
    expect(
      await screen.findByRole("heading", {
        name: "Couldn't check your session",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Staff sign-in" })).toBeNull();
  });

  it("shows an error when the password is wrong", async () => {
    vi.mocked(api.fetchSession).mockResolvedValue(null);
    vi.mocked(api.login).mockRejectedValue(
      new api.AdminApiError(401, "invalid_credentials"),
    );
    const user = userEvent.setup();
    renderAt("/admin/login");

    await user.type(await screen.findByLabelText("Email"), "abebe@admin.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The email or password is incorrect.",
    );
    expect(screen.queryByRole("heading", { name: "Dashboard" })).toBeNull();
  });

  it("signs in and lands on the dashboard", async () => {
    vi.mocked(api.fetchSession).mockResolvedValue(null);
    vi.mocked(api.login).mockResolvedValue({ email: "abebe@admin.com" });
    const user = userEvent.setup();
    renderAt("/admin/login");

    await user.type(
      await screen.findByLabelText("Email"),
      "  abebe@admin.com ",
    );
    await user.type(screen.getByLabelText("Password"), "correct-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await dashboardHeading()).toBeInTheDocument();
    expect(api.login).toHaveBeenCalledWith(
      "abebe@admin.com",
      "correct-password",
    );
  });

  it("signs out and returns to the login page", async () => {
    vi.mocked(api.fetchSession).mockResolvedValue({ email: "abebe@admin.com" });
    vi.mocked(api.logout).mockResolvedValue();
    const user = userEvent.setup();
    renderAt("/admin");

    await user.click(await screen.findByRole("button", { name: "Sign out" }));

    expect(await signInHeading()).toBeInTheDocument();
    expect(api.logout).toHaveBeenCalledTimes(1);
  });

  it("keeps the admin on the page and says so when sign-out fails", async () => {
    vi.mocked(api.fetchSession).mockResolvedValue({ email: "abebe@admin.com" });
    vi.mocked(api.logout).mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    renderAt("/admin");

    await user.click(await screen.findByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't sign out",
    );
    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
  });
});
