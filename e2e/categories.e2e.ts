import { expect, test } from "@playwright/test";
import {
  addCategory,
  deleteCategory,
  deleteItem,
  loginAsAdmin,
  openOptions,
} from "./helpers";

test.setTimeout(60_000);

test("admin can add, rename and delete a category", async ({ page }) => {
  const name = `E2E cat ${Date.now()}`;
  const renamed = `${name} renamed`;
  await loginAsAdmin(page);
  await addCategory(page, name);

  await openOptions(page, name);
  await page.getByLabel(`Rename: ${name}`).click();
  await page.getByLabel("Name (English)", { exact: true }).fill(renamed);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(`Saved "${renamed}".`)).toBeVisible();

  await deleteCategory(page, renamed);
});

test("a category that still has items cannot be deleted", async ({ page }) => {
  const stamp = Date.now();
  const category = `E2E used ${stamp}`;
  const item = `E2E item ${stamp}`;
  await loginAsAdmin(page);
  await addCategory(page, category);

  await page.goto("/admin/items/new");
  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: category });
  await page.getByLabel("Name (English)").fill(item);
  await page.getByLabel("Name (Amharic)").fill("ሙከራ");
  await page.getByLabel("Price (ETB)").fill("50");
  await page.getByRole("button", { name: "Add item" }).click();
  await expect(page.getByText(`Saved "${item}".`)).toBeVisible();

  await page.goto("/admin/categories");
  await openOptions(page, category);
  await page.getByLabel(`Delete: ${category}`).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "can't be deleted yet" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await deleteItem(page, item);
  await deleteCategory(page, category);
});
