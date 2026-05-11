import { mkdirSync } from "node:fs";
import path from "node:path";
import { test, type Page } from "@playwright/test";

const DEFAULT_BASE_URL = "https://rental-search-tracker.vercel.app";
const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");
const baseUrl = (
  process.env.SCREENSHOT_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  DEFAULT_BASE_URL
).replace(/\/$/, "");

const authEmail = cleanEnvValue(process.env.SCREENSHOT_EMAIL);
const authPassword = cleanEnvValue(process.env.SCREENSHOT_PASSWORD);

function cleanEnvValue(value?: string) {
  return value?.trim().replace(/^[“”"']|[“”"']$/g, "");
}

function screenshotPath(name: string) {
  return path.join(SCREENSHOTS_DIR, `${name}.png`);
}

async function waitForApp(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle").catch(() => undefined);
}

async function capture(page: Page, name: string) {
  await waitForApp(page);
  await page.screenshot({
    path: screenshotPath(name),
    fullPage: true,
    animations: "disabled",
  });
}

async function loginIfNeeded(page: Page) {
  const isLoginPage =
    page.url().includes("/login") ||
    (await page.getByRole("heading", { name: /log in/i }).isVisible().catch(
      () => false
    ));

  if (!isLoginPage) return;

  if (!authEmail || !authPassword) {
    throw new Error(
      "The app redirected to /login. Set SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD to capture authenticated screens."
    );
  }

  await page.getByLabel(/email/i).fill(authEmail);
  await page.getByLabel(/password/i).fill(authPassword);
  await page.getByRole("button", { name: /log in/i }).click();

  await Promise.race([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 30000,
      waitUntil: "commit",
    }),
    page.locator("text=Signed in:").waitFor({ timeout: 30000 }),
  ]).catch(async () => {
    const errorText = await page
      .locator(".text-red-700, [role='alert']")
      .first()
      .textContent()
      .catch(() => null);

    throw new Error(
      `Login did not complete within 30s.${
        errorText ? ` App error: ${errorText.trim()}` : ""
      } Check SCREENSHOT_EMAIL/SCREENSHOT_PASSWORD and use straight quotes in the command.`
    );
  });

  await waitForApp(page);
}

async function gotoApp(page: Page, route = "/") {
  await page.goto(`${baseUrl}${route}`);
  await loginIfNeeded(page);
  await waitForApp(page);
}

async function getFirstListingId(page: Page) {
  const listingLink = page.locator('a[href^="/listing/"]').first();

  if (!(await listingLink.isVisible().catch(() => false))) {
    return null;
  }

  const href = await listingLink.getAttribute("href");
  return href?.match(/\/listing\/([^/?#]+)/)?.[1] ?? null;
}

async function maybeCaptureFirstListingFlow(page: Page) {
  await gotoApp(page, "/");
  const listingId = await getFirstListingId(page);

  if (!listingId) {
    await capture(page, "07-empty-or-no-listings-state");
    return;
  }

  await gotoApp(page, `/listing/${listingId}`);
  await capture(page, "04-listing-details");

  await gotoApp(page, `/edit/${listingId}`);
  await capture(page, "05-listing-edit");

  await gotoApp(page, `/message/${listingId}`);
  await capture(page, "06-message-composer");
}

test.describe("rental app screenshot capture", () => {
  test.beforeAll(() => {
    mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test("capture important desktop and mobile states", async ({ browser }) => {
    const desktop = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    });

    await gotoApp(desktop, "/");
    await capture(desktop, "01-dashboard-listings");

    const neighborhoodFilter = desktop
      .locator("summary")
      .filter({ hasText: /neighborhoods/i })
      .first();
    if (await neighborhoodFilter.isVisible().catch(() => false)) {
      await neighborhoodFilter.click();
      await capture(desktop, "02-dashboard-filters-open");
    }

    const searchInput = desktop.getByPlaceholder(/search title/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("__no_listing_should_match_this_search__");
      await capture(desktop, "03-dashboard-empty-search");
      await searchInput.clear();
    }

    const mapButton = desktop.getByRole("button", { name: /^map$/i });
    if (await mapButton.isVisible().catch(() => false)) {
      await mapButton.click();
      await capture(desktop, "04-dashboard-map-view");

      const listButton = desktop.getByRole("button", { name: /^list$/i });
      if (await listButton.isVisible().catch(() => false)) {
        await listButton.click();
      }
    }

    await gotoApp(desktop, "/add-listing");
    await capture(desktop, "05-add-listing-form");

    await maybeCaptureFirstListingFlow(desktop);

    await gotoApp(desktop, "/viewings");
    await capture(desktop, "08-viewing-schedule");

    await desktop.close();

    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    });

    await gotoApp(mobile, "/");
    await capture(mobile, "09-mobile-dashboard");

    await gotoApp(mobile, "/add-listing");
    await capture(mobile, "10-mobile-add-listing");

    await mobile.close();
  });
});
