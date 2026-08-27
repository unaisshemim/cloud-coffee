import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { WEBMCP_PARITY_TOOL_NAMES } from "./parity-tool-names";
import { createWebMcpParityTools } from "./parity-tools";

const client = () => ({
	resume: {
		list: vi.fn(async () => [{ id: "resume-1" }]),
		tags: { list: vi.fn(async () => ["tech"]) },
		getById: vi.fn(async () => ({ id: "resume-1", name: "Main", data: defaultResumeData })),
		create: vi.fn(async () => "resume-new"),
		import: vi.fn(async () => "resume-import"),
		duplicate: vi.fn(async () => "resume-copy"),
		patch: vi.fn(async () => ({ id: "resume-1", data: { basics: { name: "Ada" } } })),
		update: vi.fn(async () => ({ id: "resume-1", name: "Updated" })),
		delete: vi.fn(async () => undefined),
		setLocked: vi.fn(async () => undefined),
		statistics: { getById: vi.fn(async () => ({ views: 1, downloads: 0 })) },
	},
	applications: {
		list: vi.fn(async () => [{ id: "app-1" }]),
		getById: vi.fn(async () => ({ id: "app-1" })),
		tags: vi.fn(async () => ["remote"]),
		stats: vi.fn(async () => ({ total: 1, byStage: [], bySource: [] })),
		create: vi.fn(async () => "app-new"),
		update: vi.fn(async () => ({ id: "app-1", status: "interview" })),
		addNote: vi.fn(async () => ({ id: "app-1" })),
		updateTimelineEntry: vi.fn(async () => ({ id: "app-1" })),
		deleteTimelineEntry: vi.fn(async () => ({ id: "app-1" })),
		delete: vi.fn(async () => undefined),
		bulkUpdate: vi.fn(async () => ({ updated: 2 })),
		bulkDelete: vi.fn(async () => ({ deleted: 2 })),
		import: vi.fn(async () => ({ imported: 1 })),
		attachDocument: vi.fn(async () => ({ id: "app-1" })),
		removeDocument: vi.fn(async () => ({ id: "app-1" })),
		ai: {
			autofill: vi.fn(async () => ({ company: "Acme", role: "Engineer", location: "", salary: "" })),
			matchScore: vi.fn(async () => ({ score: 80, gaps: [], strengths: [] })),
			tailorResume: vi.fn(async () => ({ resumeId: "resume-2", name: "Tailored" })),
			draftMessage: vi.fn(async () => ({ text: "Hello" })),
		},
	},
});

const signal = () => new AbortController().signal;

describe("createWebMcpParityTools", () => {
	let api: ReturnType<typeof client>;

	beforeEach(() => {
		api = client();
	});

	it("registers every existing MCP parity tool name", () => {
		expect(
			createWebMcpParityTools({ client: api })
				.map((tool) => tool.name)
				.sort(),
		).toEqual([...WEBMCP_PARITY_TOOL_NAMES].sort());
	});

	it("creates resumes through browser oRPC", async () => {
		const tool = createWebMcpParityTools({ client: api }).find((item) => item.name === "create_resume");
		const result = await tool?.execute(
			{ name: "Main", slug: "main", tags: ["tech"], withSampleData: true },
			{ signal: signal() },
		);

		expect(api.resume.create).toHaveBeenCalledWith({
			name: "Main",
			slug: "main",
			tags: ["tech"],
			withSampleData: true,
		});
		expect(result?.content[0]?.text).toContain("resume-new");
	});

	it("supports Chrome modelContextTesting invocations without execution options", async () => {
		const tool = createWebMcpParityTools({ client: api }).find((item) => item.name === "list_resumes");
		const result = await tool?.execute({});

		expect(api.resume.list).toHaveBeenCalledWith({ sort: "lastUpdatedAt", tags: [] });
		expect(result?.content[0]?.text).toContain("resume-1");
	});

	it("blocks destructive resume deletion without explicit confirmation", async () => {
		const tool = createWebMcpParityTools({ client: api }).find((item) => item.name === "delete_resume");
		const result = await tool?.execute({ id: "resume-1" }, { signal: signal() });

		expect(api.resume.delete).not.toHaveBeenCalled();
		expect(result?.isError).toBe(true);
		expect(result?.content[0]?.text).toMatch(/confirm/i);
	});

	it("deletes resumes when explicit confirmation is present", async () => {
		const tool = createWebMcpParityTools({ client: api }).find((item) => item.name === "delete_resume");
		const result = await tool?.execute({ id: "resume-1", confirm: true }, { signal: signal() });

		expect(api.resume.delete).toHaveBeenCalledWith({ id: "resume-1" });
		expect(result?.isError).toBeUndefined();
	});

	it("creates applications through browser oRPC", async () => {
		const tool = createWebMcpParityTools({ client: api }).find((item) => item.name === "create_application");
		await tool?.execute({ company: "Acme", role: "Engineer", status: "applied" }, { signal: signal() });

		expect(api.applications.create).toHaveBeenCalledWith({ company: "Acme", role: "Engineer", status: "applied" });
	});

	it("converts base64 PDF input into a File for application attachments", async () => {
		const tool = createWebMcpParityTools({ client: api }).find((item) => item.name === "attach_application_document");
		await tool?.execute(
			{
				id: "app-1",
				kind: "resume",
				fileName: "resume.pdf",
				contentType: "application/pdf",
				dataBase64: "JVBERi0=",
			},
			{ signal: signal() },
		);

		expect(api.applications.attachDocument).toHaveBeenCalledWith({
			id: "app-1",
			kind: "resume",
			file: expect.any(File),
		});
	});
});
