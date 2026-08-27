import { describe, expect, it, vi } from "vitest";
import { createApplicationTools } from "./application-tools";

const applications = [
	{ id: "app-1", company: "Acme", role: "Engineer", status: "applied", tags: ["remote"] },
	{ id: "app-2", company: "Beta", role: "Manager", status: "saved", tags: [] },
];

describe("createApplicationTools", () => {
	it("lists visible application rows", async () => {
		const tool = createApplicationTools({ applications, navigate: vi.fn(), openCreate: vi.fn() }).find(
			(item) => item.name === "rr.applications.list_visible",
		);

		const result = await tool?.execute({}, { signal: new AbortController().signal });

		expect(JSON.parse(result?.content[0]?.text ?? "[]")).toEqual(applications);
	});

	it("opens known applications through search params", async () => {
		const navigate = vi.fn();
		const tool = createApplicationTools({ applications, navigate, openCreate: vi.fn() }).find(
			(item) => item.name === "rr.applications.open",
		);

		await tool?.execute({ id: "app-1" }, { signal: new AbortController().signal });

		expect(navigate).toHaveBeenCalledWith({ search: expect.any(Function) });
	});

	it("starts create flow", async () => {
		const openCreate = vi.fn();
		const tool = createApplicationTools({ applications, navigate: vi.fn(), openCreate }).find(
			(item) => item.name === "rr.applications.start_create",
		);

		await tool?.execute({}, { signal: new AbortController().signal });

		expect(openCreate).toHaveBeenCalled();
	});
});
