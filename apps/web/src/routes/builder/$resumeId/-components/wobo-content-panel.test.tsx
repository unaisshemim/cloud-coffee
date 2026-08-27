// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const resume = {
	data: {
		basics: { name: "Unaiz" },
		sections: {
			experience: { items: [{ id: "exp" }] },
			education: { items: [{ id: "edu" }] },
			skills: { items: [{ id: "one" }, { id: "two" }] },
			projects: { items: [{ id: "project" }] },
			volunteer: { items: [] },
			certifications: { items: [] },
			publications: { items: [{ id: "pub" }] },
			awards: { items: [] },
		},
		customSections: [],
		metadata: {
			layout: {
				pages: [
					{
						fullWidth: true,
						main: ["experience", "education", "skills", "projects", "volunteer"],
						sidebar: ["certifications", "publications", "awards"],
					},
				],
			},
		},
	},
};

const updateResumeData = vi.fn();

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentBuilderResumeSelector: (selector: (value: typeof resume) => unknown) => selector(resume),
	useUpdateResumeData: () => updateResumeData,
}));
vi.mock("@/hooks/use-confirm", () => ({ useConfirm: () => vi.fn(async () => true) }));
vi.mock("@/hooks/use-prompt", () => ({ usePrompt: () => vi.fn(async () => null) }));
vi.mock("../-sidebar/left", () => ({
	BuilderSectionEditor: ({ section }: { section: string }) => <div>Editor: {section}</div>,
}));

const { applyContentSectionOrder, WoboContentPanel } = await import("./wobo-content-panel");

describe("WoboContentPanel", () => {
	it("shows compact section summaries", () => {
		render(<WoboContentPanel focusedSection={null} onFocusedSectionChange={vi.fn()} />);

		expect(screen.getByText("Personal Information")).toBeInTheDocument();
		expect(screen.getByText("Work Experience")).toBeInTheDocument();
		expect(screen.getByText("2 skills")).toBeInTheDocument();
		expect(screen.getAllByText("Optional · empty").length).toBeGreaterThan(0);
		expect(screen.getByRole("button", { name: "Drag Work Experience" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Drag Personal Information" })).not.toBeInTheDocument();
		expect(screen.getByText("Work Experience").closest("li")).toHaveClass("h-[52px]");
	});

	it("opens rename and remove actions from section options", () => {
		render(<WoboContentPanel focusedSection={null} onFocusedSectionChange={vi.fn()} />);

		fireEvent.click(screen.getByRole("button", { name: "Work Experience options" }));

		expect(screen.getByRole("menuitem", { name: "Rename section" })).toBeInTheDocument();
		expect(screen.getByRole("menuitem", { name: "Remove section" })).toBeInTheDocument();
	});

	it("reorders visible section slots while preserving page and column structure", () => {
		const pages = [
			{ fullWidth: false, main: ["summary", "experience", "education"], sidebar: ["skills", "awards"] },
			{ fullWidth: true, main: ["projects"], sidebar: [] },
		];

		expect(applyContentSectionOrder(pages, ["skills", "projects", "experience", "awards", "education"])).toEqual([
			{ fullWidth: false, main: ["summary", "skills", "projects"], sidebar: ["experience", "awards"] },
			{ fullWidth: true, main: ["education"], sidebar: [] },
		]);
	});

	it("opens and closes a focused existing editor", () => {
		const onFocusedSectionChange = vi.fn();
		const { rerender } = render(
			<WoboContentPanel focusedSection={null} onFocusedSectionChange={onFocusedSectionChange} />,
		);

		fireEvent.click(screen.getByRole("button", { name: /Edit Skills/i }));
		expect(onFocusedSectionChange).toHaveBeenCalledWith("skills");

		rerender(<WoboContentPanel focusedSection="skills" onFocusedSectionChange={onFocusedSectionChange} />);
		expect(screen.getByText("Editor: skills")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Back to sections" }));
		expect(onFocusedSectionChange).toHaveBeenLastCalledWith(null);
	});
});
