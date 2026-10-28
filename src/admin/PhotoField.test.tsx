import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageError, prepareImage } from "../lib/imageResize";
import { AdminApiError } from "./api";
import * as imagesApi from "./imagesApi";
import PhotoField from "./PhotoField";

vi.mock("../lib/imageResize", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/imageResize")>()),
  prepareImage: vi.fn(),
}));
vi.mock("./imagesApi");

const photo = (type = "image/jpeg", size = 1000) => {
  const file = new File(["x"], "latte.jpg", { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

function Harness({ start = null }: { start?: string | null }) {
  const [path, setPath] = useState<string | null>(start);
  return (
    <>
      <PhotoField path={path} itemName="Latte" onChange={setPath} />
      <output data-testid="path">{path ?? "none"}</output>
    </>
  );
}

function renderField(start: string | null = null) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Harness start={start} />
    </QueryClientProvider>,
  );
}

describe("photo field", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prepareImage).mockResolvedValue(new Blob(["webp"]));
    vi.mocked(imagesApi.uploadImage).mockResolvedValue("/api/images/new1");
  });

  it("converts, uploads and reports the new path", async () => {
    const user = userEvent.setup();
    renderField();
    await user.upload(screen.getByLabelText("Photo"), photo());
    expect(await screen.findByText(/Photo ready/)).toBeInTheDocument();
    expect(prepareImage).toHaveBeenCalledTimes(1);
    expect(imagesApi.uploadImage).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("path")).toHaveTextContent("/api/images/new1");
    expect(screen.getByAltText("Photo of Latte")).toBeInTheDocument();
  });

  it("rejects a file that is not JPEG, PNG or WebP without uploading", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderField();
    await user.upload(screen.getByLabelText("Photo"), photo("image/gif"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "JPEG, PNG or WebP",
    );
    expect(prepareImage).not.toHaveBeenCalled();
    expect(imagesApi.uploadImage).not.toHaveBeenCalled();
  });

  it("rejects a photo over 10 MB without uploading", async () => {
    const user = userEvent.setup();
    renderField();
    await user.upload(
      screen.getByLabelText("Photo"),
      photo("image/jpeg", 11 * 1024 * 1024),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("10 MB");
    expect(prepareImage).not.toHaveBeenCalled();
  });

  it("explains a photo that cannot be read", async () => {
    vi.mocked(prepareImage).mockRejectedValue(new ImageError("unreadable"));
    const user = userEvent.setup();
    renderField();
    await user.upload(screen.getByLabelText("Photo"), photo());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "couldn't be read",
    );
    expect(imagesApi.uploadImage).not.toHaveBeenCalled();
    expect(screen.getByTestId("path")).toHaveTextContent("none");
  });

  it("explains a failed upload and keeps the current photo", async () => {
    vi.mocked(imagesApi.uploadImage).mockRejectedValue(
      new AdminApiError(500, "server_error"),
    );
    const user = userEvent.setup();
    renderField("/api/images/old1");
    await user.upload(screen.getByLabelText("Photo"), photo());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't upload the photo",
    );
    expect(screen.getByTestId("path")).toHaveTextContent("/api/images/old1");
  });

  it("replaces an existing photo", async () => {
    const user = userEvent.setup();
    renderField("/api/images/old1");
    expect(screen.getByAltText("Photo of Latte")).toBeInTheDocument();
    await user.upload(screen.getByLabelText("Photo"), photo());
    expect(await screen.findByText(/Photo ready/)).toBeInTheDocument();
    expect(screen.getByTestId("path")).toHaveTextContent("/api/images/new1");
  });

  it("removes the photo", async () => {
    const user = userEvent.setup();
    renderField("/api/images/old1");
    await user.click(screen.getByRole("button", { name: "Remove photo" }));
    expect(screen.getByTestId("path")).toHaveTextContent("none");
    expect(screen.queryByAltText("Photo of Latte")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove photo" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Photo removed/)).toBeInTheDocument();
  });
});
