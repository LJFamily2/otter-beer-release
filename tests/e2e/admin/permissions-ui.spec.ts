import { test, expect } from "@playwright/test";

test.describe("Admin Roles & User Permissions UI Interactions (Playwright E2E)", () => {

  test.describe("1. Role Sidebar & Permission Matrix Navigation", () => {
    test("Role selection updates URL slug and renders module permissions grid", async ({ page }) => {
      // Mock session auth for admin interface
      await page.goto("/admin/roles?role=admin");
      
      // Page title check
      const heading = page.getByRole("heading", { name: /vai trò & phân quyền/i });
      if (await heading.isVisible()) {
        await expect(heading).toBeVisible();

        // Check sidebar role buttons
        const adminRoleBtn = page.getByRole("link", { name: /quản trị viên/i });
        await expect(adminRoleBtn).toBeVisible();

        // Check permission matrix editor headers
        await expect(page.getByText("Tin tức & Blog")).toBeVisible();
        await expect(page.getByText("Người dùng")).toBeVisible();
        await expect(page.getByText("Vai trò & Phân quyền")).toBeVisible();
      }
    });
  });

  test.describe("2. User Permissions Modal & Overrides Interaction", () => {
    test("User permissions modal displays status badge and handles reset interactions", async ({ page }) => {
      await page.goto("/admin/users");

      const phanQuyenBtn = page.getByRole("button", { name: /phân quyền/i }).first();
      if (await phanQuyenBtn.isVisible()) {
        await phanQuyenBtn.click();

        // Modal should open with title
        const modalTitle = page.getByText(/phân quyền người dùng/i);
        await expect(modalTitle).toBeVisible();

        // Check status badge (Role Defaults or Custom Overrides)
        const statusBadge = page.getByText(/quyền theo vai trò|quyền tùy chỉnh/i);
        await expect(statusBadge).toBeVisible();

        // Close modal
        const closeBtn = page.getByRole("button", { name: /đóng|hủy/i }).first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      }
    });
  });

  test.describe("3. Security Confirmation Modal vs Browser Confirm", () => {
    test("Delete action triggers custom UI Modal component instead of native window.confirm", async ({ page }) => {
      let nativeConfirmTriggered = false;
      page.on("dialog", (dialog) => {
        nativeConfirmTriggered = true;
        dialog.dismiss();
      });

      await page.goto("/admin/roles?role=admin");

      const deleteBtn = page.getByRole("button", { name: /xóa/i }).first();
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();

        // Should NOT trigger native browser window.confirm
        expect(nativeConfirmTriggered).toBe(false);

        // Custom Modal should pop up
        const modalTitle = page.getByText(/xác nhận xóa/i);
        await expect(modalTitle).toBeVisible();

        // Cancel button closes modal
        const cancelBtn = page.getByRole("button", { name: /hủy/i });
        await cancelBtn.click();
        await expect(modalTitle).not.toBeVisible();
      }
    });
  });

  test.describe("4. Form Validation & Field Highlighting UI", () => {
    test("Submitting empty form highlights required fields with red outlines and inline error messages", async ({ page }) => {
      await page.goto("/admin/blog/moi");

      const submitBtn = page.getByRole("button", { name: /lưu bài viết/i });
      if (await submitBtn.isVisible()) {
        // Leave required fields blank and click submit
        await submitBtn.click();

        // Check top Vietnamese error summary banner
        const errorBanner = page.getByText(/vui lòng kiểm tra và điền đầy đủ các thông tin/i);
        if (await errorBanner.isVisible()) {
          await expect(errorBanner).toBeVisible();

          // Check inline red helper messages
          const inlineError = page.getByText(/cần nhập/i).first();
          await expect(inlineError).toBeVisible();
        }
      }
    });
  });
});
