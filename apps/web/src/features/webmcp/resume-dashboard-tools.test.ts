import { describe, expect, it, vi } from "vitest";
import { createResumeDashboardTools } from "./resume-dashboard-tools";

const resumes = [
	{
		id: "resume-1",
		name: "Main",
		slug: "main",
		tags: ["tech"],
		isPublic: false,
		isLocked: false,
		updatedAt: new Date("2026-01-01T00:00:00.000Z"),
	},
	{
		id: "resume-2",
		name: "Alt",
		slug: "alt",
		tags: [],
		isPublic: true,
		isLocked: true,
		updatedAt: new Date("2026-01-02T00:00:00.000Z"),
	},
];

describe("createResumeDashboardTools", () => {
	it("lists visible resume rows without full resume data", async () => {
		const [listTool] = createResumeDashboardTools({ resumes, navigate: vi.fn(), openDialog: vi.fn() });

		const result = await listTool?.execute({}, { signal: new AbortController().signal });
		const rows = JSON.parse(result?.content[0]?.text ?? "[]");

		expect(rows).toHaveLength(2);
		expect(rows[0]).toEqual({
			id: "resume-1",
			name: "Main",
			slug: "main",
			tags: ["tech"],
			isPublic: false,
			isLocked: false,
			updatedAt: "2026-01-01T00:00:00.000Z",
		});
		expect(rows[0].data).toBeUndefined();
	});

	it("opens known resumes and rejects unknown IDs", async () => {
		const navigate = vi.fn();
		const tools = createResumeDashboardTools({ resumes, navigate, openDialog: vi.fn() });
		const openTool = tools.find((tool) => tool.name === "rr.resumes.open");

		await openTool?.execute({ id: "resume-1" }, { signal: new AbortController().signal });
		const missing = await openTool?.execute({ id: "missing" }, { signal: new AbortController().signal });

		expect(navigate).toHaveBeenCalledWith({ to: "/builder/$resumeId", params: { resumeId: "resume-1" } });
		expect(missing?.isError).toBe(true);
	});

	it("opens the create resume dialog", async () => {
		const openDialog = vi.fn();
		const tool = createResumeDashboardTools({ resumes, navigate: vi.fn(), openDialog }).find(
			(item) => item.name === "rr.resumes.start_create",
		);

		await tool?.execute({}, { signal: new AbortController().signal });

		expect(openDialog).toHaveBeenCalledWith("resume.create", undefined);
	});
});
