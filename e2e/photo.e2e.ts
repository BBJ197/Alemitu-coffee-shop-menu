import { expect, test } from "@playwright/test";
import {
  addCategory,
  deleteCategory,
  deleteItem,
  loginAsAdmin,
  makePng,
} from "./helpers";

test.setTimeout(60_000);

test("admin can upload a photo and customers see it on the menu", async ({
  page,
}) => {
  const stamp = Date.now();
  const category = `E2E photo cat ${stamp}`;
  const name = `E2E photo ${stamp}`;
  await loginAsAdmin(page);
  await addCategory(page, category);

  await page.goto("/admin/items/new");
  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: category });
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

  const png = await makePng(page);
  await photo.setInputFiles({
    name: "cup.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(
    page.getByText("Photo ready. Save the item to keep it."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Remove photo" }).click();
  await expect(
    page.getByText("Photo removed. Save the item to apply."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove photo" })).toHaveCount(
    0,
  );

  await photo.setInputFiles({
    name: "cup.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(
    page.getByText("Photo ready. Save the item to keep it."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add item" }).click();
  await expect(page.getByText(`Saved "${name}".`)).toBeVisible();

  await page.goto("/menu");
  await page.getByPlaceholder(/Search by name/).fill(name);
  const card = page.locator("li.menu-card", { hasText: name });
  await expect(card).toHaveCount(1);
  const src = (await card.locator("img").getAttribute("src")) ?? "";
  expect(src).toContain("/api/images/");
  const response = await page.request.get(new URL(src, page.url()).toString());
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toMatch(/^image\//);

  await deleteItem(page, name);
  await deleteCategory(page, category);
});
