import { test, expect } from "@playwright/test";

test.describe("Age Verification Gate E2E", () => {
  // Use unverified state for testing gate interactions
  test.use({
    storageState: { cookies: [], origins: [] },
  });

  test("displays age verification gate when unverified", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "BẠN ĐÃ ĐỦ 18 TUỔI CHƯA?" })
    ).toBeVisible();
  });

  test("clicking YES confirms age and unveils home page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Xác nhận đủ 18 tuổi/i }).click();
    await page.reload();

    // After clicking YES, dialog should vanish and site content becomes visible
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("clicking NO displays access restricted view", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Chưa đủ/i }).click();

    await expect(
      page.getByRole("heading", { name: "TRUY CẬP BỊ HẠN CHẾ" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "TÌM HIỂU THÊM" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /chọn nhầm/i })
    ).toBeVisible();
  });
});
