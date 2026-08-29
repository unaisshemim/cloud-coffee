import { expect, test } from "../fixtures/test";

test("updates profile identity while keeping Google email read-only", async ({ authPage: page, account }) => {
	await page.goto("/dashboard/settings/profile");

	const emailField = page.getByLabel("Email Address", { exact: true });
	await expect(emailField).toHaveValue(account.email);
	await expect(emailField).toBeDisabled();
	await expect(page.getByText("Email address is managed by Google.")).toBeVisible();

	const updatedName = `E2E Renamed ${Date.now()}`;
	const nameField = page.getByLabel("Name", { exact: true });
	await expect(nameField).toBeVisible();
	await nameField.fill(updatedName);
	await page.getByRole("button", { name: "Save Changes" }).click();

	// The save round-trips through the API; a reload must show the new value
	await page.reload();
	await expect(page.getByLabel("Name", { exact: true })).toHaveValue(updatedName);
});
