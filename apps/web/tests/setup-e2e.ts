import { expect, test } from "./fixtures";

test("first run redirects to setup and shows the generated API token once", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);

  await page.locator("#base-url").fill("https://sandfactory.test");
  await page.locator("#repo-root").fill("/srv/projects");
  await page.getByRole("button", { name: /save and generate api token/i }).click();

  await expect(page.getByText(/copy your api token now/i)).toBeVisible();
  await expect(page.getByText(/^sf_[\w-]+$/)).toBeVisible();

  await page.getByRole("button", { name: /continue to dashboard/i }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(/central command for agent runs and preview environments/i)).toBeVisible();
  await expect(page.getByText("https://sandfactory.test")).toBeVisible();
  await expect(page.getByText("/srv/projects")).toBeVisible();

  await page.goto("/setup");
  await expect(page).toHaveURL(/\/$/);
});
