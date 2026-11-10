import { expect, test } from "@playwright/test";

test.describe("customer menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/menu");
    await expect(page.getByText(/Macchiato/).first()).toBeVisible();
  });

  test("search narrows the menu", async ({ page }) => {
    await page.getByPlaceholder(/Search by name/).fill("iced");
    await expect(page.getByText(/Iced coffee/).first()).toBeVisible();
    await expect(page.getByText(/Macchiato/)).toHaveCount(0);
  });

  test("category filter narrows the menu", async ({ page }) => {
    await page
      .getByRole("group", { name: "Categories" })
      .getByRole("button", { name: /Cold drinks/ })
      .click();
    await expect(page.getByText(/Iced coffee/).first()).toBeVisible();
    await expect(page.getByText(/Macchiato/)).toHaveCount(0);
  });

  test("language toggle switches to Amharic", async ({ page }) => {
    await page.getByRole("button", { name: "Amharic" }).click();
    await expect(page.getByRole("button", { name: "Amharic" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      page.getByPlaceholder("በስም፣ በመግለጫ ወይም በምድብ ፈልግ"),
    ).toBeVisible();
  });
});
