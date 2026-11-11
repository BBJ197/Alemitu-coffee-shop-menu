import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.setTimeout(60_000);

async function addCategory(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.goto("/admin/categories");
  await page.getByLabel("New category name (English)").fill(name);
  await page.getByRole("button", { name: "Add category" }).click();
  await expect(page.getByText(`Added "${name}".`)).toBeVisible();
}

async function deleteCategory(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.goto("/admin/categories");
  await page.getByLabel(`Options: ${name}`).click();
  await page.getByLabel(`Delete: ${name}`).click();
  await page.getByRole("button", { name: "Delete category" }).click();
  await expect(page.getByText(`Deleted "${name}".`)).toBeVisible();
}

test("admin can add, rename and delete a category", async ({ page }) => {
  const name = `E2E cat ${Date.now()}`;
  const renamed = `${name} renamed`;
  await loginAsAdmin(page);
  await addCategory(page, name);

  await page.getByLabel(`Options: ${name}`).click();
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
  await page.getByLabel(`Options: ${category}`).click();
  await page.getByLabel(`Delete: ${category}`).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "can't be deleted yet" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.goto("/admin/items");
  await page.getByLabel(`Options: ${item}`).click();
  await page.getByLabel(`Delete: ${item}`).click();
  await page.getByRole("button", { name: "Delete item" }).click();
  await expect(page.getByLabel(`Edit: ${item}`)).toHaveCount(0);

  await deleteCategory(page, category);
});
