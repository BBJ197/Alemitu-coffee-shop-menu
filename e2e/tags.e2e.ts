import { expect, test } from "@playwright/test";
import { loginAsAdmin, openOptions } from "./helpers";

test.setTimeout(60_000);

test("admin can add, rename and delete a tag", async ({ page }) => {
  const name = `E2E tag ${Date.now()}`;
  const renamed = `${name} renamed`;
  await loginAsAdmin(page);
  await page.goto("/admin/tags");

  await page.getByLabel("New tag name (English)").fill(name);
  await page.getByRole("button", { name: "Add tag" }).click();
  await expect(page.getByText(`Added "${name}".`)).toBeVisible();

  await openOptions(page, name);
  await page.getByLabel(`Rename: ${name}`).click();
  await page.getByLabel("Name (English)", { exact: true }).fill(renamed);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(`Saved "${renamed}".`)).toBeVisible();

  await openOptions(page, renamed);
  await page.getByLabel(`Delete: ${renamed}`).click();
  await page.getByRole("button", { name: "Delete tag" }).click();
  await expect(page.getByText(`Deleted "${renamed}".`)).toBeVisible();
});
