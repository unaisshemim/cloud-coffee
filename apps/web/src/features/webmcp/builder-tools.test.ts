import type { Resume } from "@/features/resume/builder/draft";
import { beforeEach, describe, expect, it } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { useResumeStore } from "@/features/resume/builder/draft";
import { createBuilderTools } from "./builder-tools";

const resume = (overrides: Partial<Resume> = {}): Resume => ({
	id: "resume-1",
	name: "Main",
	slug: "main",
	tags: [],
	data: defaultResumeData,
	isLocked: false,
	updatedAt: new Date("2026-01-01T00:00:00.000Z"),
	...overrides,
});

describe("createBuilderTools", () => {
	beforeEach(() => {
		useResumeStore.getState().reset();
		useResumeStore.getState().initialize(resume());
	});

	it("reads the current builder resume at execution time", async () => {
		const tool = createBuilderTools().find((item) => item.name === "rr.builder.read_current_resume");

		const result = await tool?.execute({}, { signal: new AbortController().signal });
		const body = JSON.parse(result?.content[0]?.text ?? "{}");

		expect(body.id).toBe("resume-1");
		expect(body.data).toBeDefined();
	});

	it("applies patches through the builder store", async () => {
		const tool = createBuilderTools().find((item) => item.name === "rr.builder.apply_patch");

		const result = await tool?.execute(
			{ operations: [{ op: "replace", path: "/basics/name", value: "Ada Lovelace" }] },
			{ signal: new AbortController().signal },
		);

		expect(result?.isError).toBeUndefined();
		expect(useResumeStore.getState().resume?.data.basics.name).toBe("Ada Lovelace");
		expect(useResumeStore.getState().saveStatus).toBe("saving");
	});

	it("rejects patches when the current resume is locked", async () => {
		useResumeStore.getState().initialize(resume({ isLocked: true }));
		const tool = createBuilderTools().find((item) => item.name === "rr.builder.apply_patch");

		const result = await tool?.execute(
			{ operations: [{ op: "replace", path: "/basics/name", value: "Ada Lovelace" }] },
			{ signal: new AbortController().signal },
		);

		expect(result?.isError).toBe(true);
		expect(result?.content[0]?.text).toMatch(/locked/i);
	});
});
