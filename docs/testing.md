# Testing Strategy

## The Golden Rule for AI Agents

> **MANDATORY WORKFLOW — READ THIS FIRST**
>
> Every AI agent (Antigravity, Claude Code, Cursor, Copilot, etc.) making changes to this codebase **MUST** follow this exact order:
>
> 1. **Read existing tests** — understand what is already covered
> 2. **Run existing tests** — confirm the baseline passes (`pnpm test`)
> 3. **Make the requested changes**
> 4. **Write new tests** for the new/changed behavior
> 5. **Run all tests** — confirm nothing is broken (`pnpm test && pnpm run test:e2e`)
>
> No PR should ever reduce test coverage. If you cannot write a test for a change, document why in a code comment.

This rule is also enforced in [`AGENTS.md`](../AGENTS.md) and [`CLAUDE.md`](../CLAUDE.md).

---

## Test Types

| Type | Tool | What it tests | Location |
|---|---|---|---|
| **Unit** | Jest | Pure functions, utilities, Zod schemas, model logic | `tests/unit/` |
| **Integration** | Jest | API route handlers (mocked DB) | `tests/integration/` |
| **E2E** | Playwright | Full user flows — browser interactions, CRUD, forms | `tests/e2e/` |

---

## Directory Structure

```
tests/
├── unit/
│   ├── lib/
│   │   ├── utils.test.ts          ← slugify, formatDate, cn, etc.
│   │   └── seo.test.ts            ← buildSEO() metadata output
│   └── validation/
│       ├── beer.test.ts           ← Zod beer schema validation
│       └── contact.test.ts        ← Zod contact form schema
├── integration/
│   └── api/
│       ├── beers.test.ts          ← API route handlers with mocked DB
│       ├── blog.test.ts
│       ├── events.test.ts
│       ├── contact.test.ts
│       └── upload.test.ts
└── e2e/
    ├── navigation.spec.ts         ← Navbar links, 404 page, language switch
    ├── menu.spec.ts               ← Beer catalog browsing
    ├── blog.spec.ts               ← Blog listing + post detail
    ├── events.spec.ts             ← Events listing
    ├── contact.spec.ts            ← Contact form submission + validation
    └── admin/
        ├── auth.spec.ts           ← Login flow, access control
        ├── beers.spec.ts          ← Beer CRUD — create, edit, delete
        ├── blog.spec.ts           ← Blog CRUD + publish/unpublish
        └── events.spec.ts         ← Event CRUD
```

---

## Running Tests

```bash
# Unit + integration tests
pnpm test                   # Run all Jest tests once
pnpm run test:watch         # Watch mode (TDD)
pnpm run test:coverage      # With coverage report

# E2E tests
pnpm run test:e2e           # Run all Playwright tests (headless)
pnpm run test:e2e:ui        # Playwright UI mode (visual debugging)
pnpm run test:e2e:headed    # Run with browser visible

# Type checking
pnpm run type-check         # tsc --noEmit (no emit, just validate)
```

---

## Jest — Unit & Integration Tests

### What to unit test
- All functions in `src/lib/` (utils, seo, validation schemas)
- Mongoose model pre-save hooks and validators
- Business logic helpers

### What to integration test
- Each API route handler: test request handling, validation rejection, DB interaction (mocked)
- Test all HTTP methods: GET, POST, PUT, DELETE
- Test error cases: missing fields, invalid types, not found

### Mocking MongoDB
```typescript
// jest.setup.ts handles global mocks
// In individual test files, mock the connection:
jest.mock("@/lib/mongodb", () => ({
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}));

// Mock Mongoose models:
jest.mock("@/models/Beer", () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));
```

### Example: Unit test
```typescript
// tests/unit/lib/utils.test.ts
import { slugify, formatDate, cn } from "@/lib/utils";

describe("slugify", () => {
  it("converts Vietnamese text to slug", () => {
    expect(slugify("Bia Thủ Công")).toBe("bia-thu-cong");
  });

  it("removes special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("one   two   three")).toBe("one-two-three");
  });
});
```

### Example: Integration test (API route)
```typescript
// tests/integration/api/beers.test.ts
import { GET, POST } from "@/app/api/beers/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/mongodb");
jest.mock("@/models/Beer");

describe("GET /api/beers", () => {
  it("returns beer list", async () => {
    const mockBeers = [{ _id: "1", name: "Otter IPA", slug: "otter-ipa" }];
    (Beer.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockBeers),
    });

    const req = new NextRequest("http://localhost/api/beers");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Otter IPA");
  });
});
```

---

## Playwright — E2E Tests

### What to E2E test
- **Critical user flows** — navigation, reading content, submitting the contact form
- **CRUD operations** — admin creating/editing/deleting beers, blog posts, events
- **Auth flows** — login, logout, access control (admin redirects)
- **Form validation** — submitting invalid data, error messages appearing
- **i18n** — language switcher changes content correctly

### Writing a CRUD test
```typescript
// tests/e2e/admin/beers.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Admin — Beer CRUD", () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/api/auth/signin");
    // Mock or use test Google account
  });

  test("creates a new beer", async ({ page }) => {
    await page.goto("/admin/beers");
    await page.getByRole("button", { name: "Thêm bia mới" }).click();

    await page.getByLabel("Tên bia").fill("Test IPA");
    await page.getByLabel("Phong cách").fill("IPA");
    await page.getByLabel("ABV").fill("6.5");
    await page.getByLabel("Giá").fill("80000");
    await page.getByRole("button", { name: "Lưu" }).click();

    await expect(page.getByText("Test IPA")).toBeVisible();
  });

  test("edits an existing beer", async ({ page }) => {
    await page.goto("/admin/beers");
    await page.getByTestId("beer-row-otter-ipa").getByRole("button", { name: "Sửa" }).click();
    await page.getByLabel("Giá").clear();
    await page.getByLabel("Giá").fill("90000");
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(page.getByText("90,000 ₫")).toBeVisible();
  });

  test("deletes a beer with confirmation", async ({ page }) => {
    await page.goto("/admin/beers");
    await page.getByTestId("beer-row-test-beer").getByRole("button", { name: "Xóa" }).click();
    await expect(page.getByRole("dialog")).toBeVisible(); // Confirm dialog
    await page.getByRole("button", { name: "Xác nhận xóa" }).click();
    await expect(page.getByTestId("beer-row-test-beer")).not.toBeVisible();
  });
});
```

### Example: Contact form E2E test
```typescript
// tests/e2e/contact.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Contact Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("submits valid form successfully", async ({ page }) => {
    await page.getByLabel("Họ và tên").fill("Nguyễn Văn A");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Chủ đề").fill("Đặt bàn");
    await page.getByLabel("Nội dung").fill("Tôi muốn đặt bàn cho 5 người.");
    await page.getByRole("button", { name: "Gửi" }).click();
    await expect(page.getByText("Gửi thành công")).toBeVisible();
  });

  test("shows validation errors for empty required fields", async ({ page }) => {
    await page.getByRole("button", { name: "Gửi" }).click();
    await expect(page.getByText("Vui lòng nhập họ tên")).toBeVisible();
    await expect(page.getByText("Vui lòng nhập email")).toBeVisible();
  });

  test("shows error for invalid email", async ({ page }) => {
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Gửi" }).click();
    await expect(page.getByText("Email không hợp lệ")).toBeVisible();
  });
});
```

---

## Test Data & Fixtures

Playwright fixtures live in `tests/e2e/fixtures/`:

```typescript
// tests/e2e/fixtures/index.ts
import { test as base } from "@playwright/test";

// Extend base test with authenticated admin context
export const test = base.extend({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "tests/e2e/.auth/admin.json", // saved login state
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});
```

### Seeding test data
```bash
# Run before E2E tests in CI
node tests/e2e/scripts/seed-test-db.js
```

---

## Coverage Requirements

| Layer | Minimum coverage |
|---|---|
| `src/lib/` | 90% |
| `src/models/` | 80% |
| API routes | 80% |
| Components | 60% (Playwright covers the rest) |

View coverage: `pnpm run test:coverage` → opens `coverage/lcov-report/index.html`

---

## Test Naming Convention

| Pattern | Example |
|---|---|
| Unit tests | `describe("functionName")` → `it("does X when Y")` |
| API tests | `describe("GET /api/beers")` → `it("returns 200 with beer list")` |
| E2E tests | `test.describe("Feature Name")` → `test("user can do X")` |
| File names | `utils.test.ts` (unit), `beers.spec.ts` (e2e) |

---

## CI Integration

Tests run automatically on every push and pull request.
See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) for the full pipeline.

**Required to pass before merge:**
- ESLint → no errors
- TypeScript → no type errors
- Jest unit + integration → all pass, coverage thresholds met
- Playwright E2E → all pass
- `pnpm run build` → successful
