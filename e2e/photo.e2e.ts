import { expect, test } from "@playwright/test";
import { loginAsAdmin, makePng } from "./helpers";

test.setTimeout(60_000);

test("admin can upload a photo, customers see it, and it can be removed", async ({
  page,
}) => {
  const name = `E2E photo ${Date.now()}`;
  await loginAsAdmin(page);
  await page.goto("/admin/items/new");
  await page.getByLabel("Category", { exact: true }).selectOption({ index: 1 });
  await page.getByLabel("Name (English)").fill(name);
  await page.getByLabel("Name (Amharic)").fill("ሙከራ");
  await page.getByLabel("Price (ETB)").fill("75");

  const photo = page.getByLabel("Photo", { exact: true });
  await photo.setInputFiles({
    name: "note.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a photo"),
  });
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Choose a JPEG, PNG or WebP photo." }),
  ).toBeVisible();

  await photo.setInputFiles({
    name: "cup.png",
    mimeType: "image/png",
    buffer: await makePng(page),
  });
  await expect(
    page.getByText("Photo ready. Save the item to keep it."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add item" }).click();
  await expect(page.getByText(`Saved "${name}".`)).toBeVisible();

  await page.goto("/menu");
  await page.getByPlaceholder(/Search by name/).fill(name);
  const image = page.locator('img[src*="/api/images/"]');
  await expect(image).toHaveCount(1);
  const src = (await image.getAttribute("src")) ?? "";
  const response = await page.request.get(new URL(src, page.url()).toString());
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toMatch(/^image\//);

  await page.goto("/admin/items");
  await page.getByLabel(`Options: ${name}`).click();
  await page.getByLabel(`Delete: ${name}`).click();
  await page.getByRole("button", { name: "Delete item" }).click();
  await expect(page.getByLabel(`Edit: ${name}`)).toHaveCount(0);
});
