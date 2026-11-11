import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL ?? "";
const password = process.env.E2E_ADMIN_PASSWORD ?? "";

test("signed-out visitors are sent to the login page", async ({ page }) => {
  await page.goto("/admin/items");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("admin can log in, create, edit and delete an item", async ({ page }) => {
  const name = `E2E item ${Date.now()}`;

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);

  await page.goto("/admin/items/new");
  await page.getByLabel("Category", { exact: true }).selectOption({ index: 1 });
  await page.getByLabel("Name (English)").fill(name);
  await page.getByLabel("Name (Amharic)").fill("ሙከራ");
  await page.getByLabel("Price (ETB)").fill("99");
  await page.getByRole("button", { name: "Add item" }).click();
  await expect(page).toHaveURL(/\/admin\/items$/);
  await expect(page.getByText(`Saved "${name}".`)).toBeVisible();

  await page.getByLabel(`Options: ${name}`).click();
  await page.getByLabel(`Edit: ${name}`).click();
  await page.getByLabel("Price (ETB)").fill("120");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/admin\/items$/);
  await expect(page.getByLabel(`Edit: ${name}`)).toBeAttached();

  await page.getByLabel(`Options: ${name}`).click();
  await page.getByLabel(`Delete: ${name}`).click();
  await page.getByRole("button", { name: "Delete item" }).click();
  await expect(page.getByLabel(`Edit: ${name}`)).toHaveCount(0);
});
