import { createHash } from "node:crypto";

import { apiTokens, createDb } from "@sandfactory/db";

import { expect, test } from "./fixtures";

test.describe.configure({ mode: "serial" });

function hashApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function readStoredTokenHashes() {
  const database = createDb("file:.data/e2e.sqlite");

  try {
    return database.db.select({ tokenHash: apiTokens.tokenHash }).from(apiTokens).all();
  } finally {
    database.close();
  }
}

test("first launch requires setup and shows the generated API token once", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);

  await page.locator("#base-url").fill("https://sandfactory.test");
  await page.locator("#repo-root").fill("/srv/projects");
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByText(/only time the raw value will be shown/i)).toBeVisible();

  const apiToken = (await page.locator("code").textContent())?.trim();

  expect(apiToken).toMatch(/^sf_[\w-]+$/);

  const storedTokens = readStoredTokenHashes();

  expect(storedTokens).toHaveLength(1);
  expect(storedTokens[0]?.tokenHash).toBe(hashApiToken(apiToken!));
  expect(storedTokens[0]?.tokenHash).not.toBe(apiToken);

  await page.getByRole("button", { name: /finish/i }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("https://sandfactory.test")).toBeVisible();
  await expect(page.getByText("/srv/projects")).toBeVisible();

  await page.getByRole("button", { name: /settings/i }).click();
  await expect(page).toHaveURL(/\/settings$/);

  await page.getByRole("button", { name: /dashboard/i }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/setup");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(/setup complete/i)).not.toBeVisible();
});

test("settings can rotate the API token and only show the replacement value once", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings$/);

  await page.getByRole("button", { name: /regenerate api token/i }).click();
  await expect(page.getByText(/only time the raw value will be shown/i)).toBeVisible();

  const replacementToken = (await page.locator("code").textContent())?.trim();

  expect(replacementToken).toMatch(/^sf_[\w-]+$/);

  const storedTokens = readStoredTokenHashes();

  expect(storedTokens).toHaveLength(1);
  expect(storedTokens[0]?.tokenHash).toBe(hashApiToken(replacementToken!));
  expect(storedTokens[0]?.tokenHash).not.toBe(replacementToken);

  await page.reload();

  await expect(page.getByText(/only time the raw value will be shown/i)).not.toBeVisible();
  await expect(page.locator("code")).toHaveCount(0);
});
