import { expect, test } from "./fixtures";

test.describe.configure({ mode: "serial" });

const LOGIN_PASSWORD = "Test@12345678";

let apiToken = "";

test("first launch requires setup and redirects unauthenticated browser requests to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);
  await expect(page.getByText(/welcome to sandfactory/i)).toBeVisible();
  await expect(page.getByText(/step 1 of 3/i)).toBeVisible();

  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByText(/server configuration/i)).toBeVisible();

  await page.locator("#base-url").fill("https://sandfactory.test");
  await page.locator("#repo-root").fill("/srv/projects");
  await page.locator("#login-password").fill(LOGIN_PASSWORD);
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByText(/only time the raw value will be shown/i)).toBeVisible();

  apiToken = ((await page.locator("code").textContent())?.trim() ?? "");

  expect(apiToken).toMatch(/^sf_[\w-]+$/);

  await page.getByRole("button", { name: /finish/i }).click();

  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/setup");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText(/setup complete/i)).not.toBeVisible();
});

test("single-user login works end to end and establishes an authenticated UI session", async ({ page }) => {
  await page.goto("/login");

  await page.locator("#login-password").fill(LOGIN_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("https://sandfactory.test")).toBeVisible();
  await expect(page.getByText("/srv/projects")).toBeVisible();

  await page.getByRole("link", { name: /settings/i }).click();
  await expect(page).toHaveURL(/\/settings$/);

  await page.reload();
  await expect(page).toHaveURL(/\/settings$/);

  await page.getByRole("link", { name: /dashboard/i }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("button", { name: "Sandfactory" }).click();
  await page.getByRole("button", { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("api requests accept a valid bearer token and reject invalid tokens", async ({ request }) => {
  const unauthenticatedResponse = await request.get("/api/status");
  expect(unauthenticatedResponse.status()).toBe(401);

  const invalidTokenResponse = await request.get("/api/status", {
    headers: { Authorization: "Bearer sf_invalid" },
  });
  expect(invalidTokenResponse.status()).toBe(401);

  const validTokenResponse = await request.get("/api/status", {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  expect(validTokenResponse.status()).toBe(200);
  expect(await validTokenResponse.json()).toEqual({ ok: true });
});

test("settings can rotate the API token and only show the replacement value once", async ({ page, request }) => {
  await page.goto("/login");
  await page.locator("#login-password").fill(LOGIN_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();

  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings$/);

  await page.getByRole("button", { name: /regenerate api token/i }).click();
  await expect(page.getByText(/only time the raw value will be shown/i)).toBeVisible();

  const replacementToken = (await page.locator("code").textContent())?.trim();

  expect(replacementToken).toMatch(/^sf_[\w-]+$/);
  expect(replacementToken).not.toBe(apiToken);

  // Old token should no longer work
  const oldTokenResponse = await request.get("/api/status", {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  expect(oldTokenResponse.status()).toBe(401);

  // New token should work
  const newTokenResponse = await request.get("/api/status", {
    headers: { Authorization: `Bearer ${replacementToken}` },
  });
  expect(newTokenResponse.status()).toBe(200);

  await page.reload();

  await expect(page.getByText(/only time the raw value will be shown/i)).not.toBeVisible();
  await expect(page.locator("code")).toHaveCount(0);
});
