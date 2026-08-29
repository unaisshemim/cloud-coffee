import { expect, test } from "../fixtures/test";

test("shows Google as the only interactive sign-in method", async ({ page }) => {
	await page.goto("/auth/login");

	await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
	await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
	await expect(page.getByText("Forgot Password?", { exact: true })).toHaveCount(0);
	await expect(page.getByText("Create one now", { exact: true })).toHaveCount(0);

	const googleAction = page
		.getByRole("button", { name: "Continue with Google" })
		.or(page.getByRole("status").filter({ hasText: "Google sign-in is unavailable" }));
	await expect(googleAction).toBeVisible();
});

for (const legacyPath of [
	"/auth/register",
	"/auth/forgot-password",
	"/auth/reset-password",
	"/auth/verify-2fa",
	"/auth/verify-2fa-backup",
]) {
	test(`${legacyPath} redirects to Google sign-in`, async ({ page }) => {
		await page.goto(legacyPath);
		await expect(page).toHaveURL(/\/auth\/login/);
	});
}
