import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminRoutes from "./AdminRoutes";
import * as api from "./api";
import * as qr from "./qr";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  fetchSession: vi.fn(),
}));
vi.mock("./qr", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./qr")>()),
  makeQrPng: vi.fn(),
  downloadFile: vi.fn(),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/admin/qr"]}>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function setAddress(text: string) {
  const user = userEvent.setup();
  const input = await screen.findByLabelText("Menu address");
  await user.clear(input);
  if (text) await user.type(input, text);
  return user;
}

describe("admin QR page", () => {
  beforeEach(() => {
    vi.mocked(api.fetchSession).mockResolvedValue({ email: "abebe@admin.com" });
    vi.mocked(qr.makeQrPng).mockResolvedValue("data:image/png;base64,AAAA");
    vi.mocked(qr.downloadFile).mockClear();
  });

  it("starts with this site's /menu address and draws a code for it", async () => {
    renderPage();
    const image = await screen.findByAltText(/QR code that opens/);
    expect(image).toHaveAttribute(
      "alt",
      `QR code that opens ${window.location.origin}/menu`,
    );
    expect(image.getAttribute("src")).toMatch(/^data:image\/svg\+xml/);
  });

  it("warns that a local address won't work for customers", async () => {
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "only works on your own computer",
    );
  });

  it("redraws for a real address and drops the local warning", async () => {
    renderPage();
    await setAddress("https://alemitu.example/menu");
    expect(
      await screen.findByAltText(
        "QR code that opens https://alemitu.example/menu",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("hints when the address does not end in /menu", async () => {
    renderPage();
    await setAddress("https://alemitu.example");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "doesn't end in /menu",
    );
  });

  it("explains an invalid address and disables downloads", async () => {
    renderPage();
    await setAddress("hello");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a web address",
    );
    expect(screen.queryByAltText(/QR code/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Download SVG" })).toBeDisabled();
  });

  it("downloads the PNG", async () => {
    renderPage();
    const user = await setAddress("https://alemitu.example/menu");
    await screen.findByAltText(/QR code that opens https:\/\/alemitu/);
    await user.click(screen.getByRole("button", { name: "Download PNG" }));
    expect(qr.makeQrPng).toHaveBeenCalledWith("https://alemitu.example/menu");
    expect(qr.downloadFile).toHaveBeenCalledWith(
      "data:image/png;base64,AAAA",
      "alemitu-menu-qr.png",
    );
    expect(await screen.findByText("PNG downloaded.")).toBeInTheDocument();
  });

  it("downloads the SVG", async () => {
    renderPage();
    const user = await setAddress("https://alemitu.example/menu");
    await screen.findByAltText(/QR code that opens https:\/\/alemitu/);
    await user.click(screen.getByRole("button", { name: "Download SVG" }));
    expect(qr.downloadFile).toHaveBeenCalledWith(
      expect.stringMatching(/^data:image\/svg\+xml/),
      "alemitu-menu-qr.svg",
    );
  });

  it("says so when the PNG cannot be made", async () => {
    vi.mocked(qr.makeQrPng).mockRejectedValue(new Error("no canvas"));
    renderPage();
    const user = await setAddress("https://alemitu.example/menu");
    await screen.findByAltText(/QR code that opens https:\/\/alemitu/);
    await user.click(screen.getByRole("button", { name: "Download PNG" }));
    expect(
      await screen.findByText(/Couldn't make the PNG/),
    ).toBeInTheDocument();
    expect(qr.downloadFile).not.toHaveBeenCalled();
  });
});
