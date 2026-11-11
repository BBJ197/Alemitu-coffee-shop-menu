import { expect, type Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL ?? "");
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

/** Draws a small PNG in the browser so the tests need no image files. */
export async function makePng(page: Page): Promise<Buffer> {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.fillStyle = "#6f4e37";
    ctx.fillRect(0, 0, 300, 200);
    ctx.fillStyle = "#f5e6d3";
    ctx.fillRect(40, 40, 220, 120);
    return canvas.toDataURL("image/png");
  });
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

/** Opens a row's Options menu, unless it is already open. */
export async function openOptions(page: Page, name: string) {
  const toggle = page.getByLabel(`Options: ${name}`);
  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
  }
}

export async function addCategory(page: Page, name: string) {
  await page.goto("/admin/categories");
  await page.getByLabel("New category name (English)").fill(name);
  await page.getByRole("button", { name: "Add category" }).click();
  await expect(page.getByText(`Added "${name}".`)).toBeVisible();
}

export async function deleteCategory(page: Page, name: string) {
  await page.goto("/admin/categories");
  await openOptions(page, name);
  await page.getByLabel(`Delete: ${name}`).click();
  await page.getByRole("button", { name: "Delete category" }).click();
  await expect(page.getByText(`Deleted "${name}".`)).toBeVisible();
}

export async function deleteItem(page: Page, name: string) {
  await page.goto("/admin/items");
  await openOptions(page, name);
  await page.getByLabel(`Delete: ${name}`).click();
  await page.getByRole("button", { name: "Delete item" }).click();
  await expect(page.getByLabel(`Edit: ${name}`)).toHaveCount(0);
}
