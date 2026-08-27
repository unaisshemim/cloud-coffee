import { createSampleResumeFromDashboard, openSidebarSection } from "../fixtures/resume";
import { expect, test } from "../fixtures/test";

test("offers only the Treecko resume template", async ({ authPage: page }, testInfo) => {
	await createSampleResumeFromDashboard(page, testInfo);

	await openSidebarSection(page, "Template");
	await page.getByRole("button", { name: "Treecko", exact: true }).click();
	const gallery = page.getByRole("dialog", { name: "Template Gallery" });
	await expect(gallery).toBeVisible();

	await expect(gallery.getByRole("img")).toHaveCount(1);
	await expect(gallery.getByRole("img", { name: "Treecko", exact: true })).toBeVisible();
});
