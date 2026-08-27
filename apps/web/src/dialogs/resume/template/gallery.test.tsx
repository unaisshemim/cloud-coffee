// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { Dialog } from "@reactive-resume/ui/components/dialog";
import { useDialogStore } from "@/dialogs/store";
import { templates } from "./data";

const updateResumeData = vi.hoisted(() => vi.fn());
const undo = vi.hoisted(() => vi.fn());

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({
		data: { metadata: { template: "treecko" } },
	}),
	useResumeStore: (selector: (state: { undo: typeof undo }) => unknown) => selector({ undo }),
	useUpdateResumeData: () => updateResumeData,
}));

const { TemplateGalleryDialog } = await import("./gallery");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

afterEach(() => {
	updateResumeData.mockReset();
	undo.mockReset();
	useDialogStore.setState({ open: false, activeDialog: null, onBeforeClose: null });
});

const renderGallery = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Dialog open>
				<TemplateGalleryDialog />
			</Dialog>
		</I18nProvider>,
	);

describe("TemplateGalleryDialog", () => {
	it("renders the documented title and intro copy", () => {
		renderGallery();
		expect(screen.getByText("Template Gallery")).toBeInTheDocument();
		expect(screen.getByText(/Treecko is the available resume design/)).toBeInTheDocument();
	});

	it("renders one tile per template", () => {
		renderGallery();
		const images = screen.getAllByRole("img");
		expect(images).toHaveLength(Object.keys(templates).length);
	});

	it("ring-highlights the Treecko template tile", () => {
		renderGallery();
		const treeckoImg = screen.getByAltText("Treecko");
		const button = treeckoImg.closest("button") as HTMLButtonElement;
		expect(button.className).toContain("ring-ring");
	});

	it("applies the Treecko preset through the gallery update", () => {
		renderGallery();
		const button = screen.getByAltText("Treecko").closest("button") as HTMLButtonElement;
		fireEvent.click(button);

		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: typeof defaultResumeData) => void;
		const draft = structuredClone(defaultResumeData);
		recipe(draft);

		expect(draft.metadata).toMatchObject({
			template: "treecko",
			page: { marginX: 36, marginY: 36 },
			design: { colors: { primary: "rgba(0, 150, 137, 1)" } },
			typography: {
				body: { fontFamily: "Roboto", fontWeights: ["400", "600"], fontSize: 10, lineHeight: 1.45 },
				heading: { fontFamily: "Roboto", fontWeights: ["600"] },
			},
		});
	});
});
