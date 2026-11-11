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
  browser,
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

  // A separate browser, like a customer's phone. The admin form already loaded the
  // menu in this one, and the API lets browsers keep the menu for 30 seconds.
  const customerContext = await browser.newContext({
    baseURL: "http://localhost:5173",
    viewport: { width: 412, height: 915 },
  });
  const customer = await customerContext.newPage();
  await customer.goto("/menu");
  await customer.getByPlaceholder(/Search by name/).fill(name);
  const card = customer.locator("li.menu-card", { hasText: name });
  await expect(card).toHaveCount(1);
  const src = (await card.locator("img").getAttribute("src")) ?? "";
  expect(src).toContain("/api/images/");
  const response = await customer.request.get(
    new URL(src, customer.url()).toString(),
  );
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toMatch(/^image\//);
  await customerContext.close();

  await deleteItem(page, name);
  await deleteCategory(page, category);
});
