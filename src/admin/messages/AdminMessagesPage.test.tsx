import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminMessagesPage from "./AdminMessagesPage";
import * as api from "./messagesApi";

vi.mock("./messagesApi");

const msg = (over: Partial<api.ContactMessageRow> = {}) => ({
  id: "m1",
  name: "Abel",
  email: "abel@example.com",
  message: "Do you open on Sunday?",
  isRead: false,
  createdAt: "2026-11-03T10:00:00.000Z",
  ...over,
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminMessagesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AdminMessagesPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists messages and the unread count", async () => {
    vi.mocked(api.fetchMessages).mockResolvedValue([msg()]);
    renderPage();
    expect(
      await screen.findByText("Do you open on Sunday?"),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 unread/)).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    vi.mocked(api.fetchMessages).mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText("No messages yet.")).toBeInTheDocument();
  });

  it("marks a message as read", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchMessages).mockResolvedValue([msg()]);
    vi.mocked(api.setMessageRead).mockResolvedValue(msg({ isRead: true }));
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Mark as read" }),
    );
    expect(api.setMessageRead).toHaveBeenCalledWith("m1", true);
  });

  it("asks for confirmation before deleting", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchMessages).mockResolvedValue([msg()]);
    vi.mocked(api.deleteMessage).mockResolvedValue();
    renderPage();
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    expect(api.deleteMessage).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));
    expect(api.deleteMessage).toHaveBeenCalledWith("m1");
  });

  it("offers a retry when loading fails", async () => {
    vi.mocked(api.fetchMessages).mockRejectedValue(new Error("down"));
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn't load/i,
    );
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});
