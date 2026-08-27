import { describe, expect, it, vi } from "vitest";
import { createAgentTools } from "./agent-tools";

describe("createAgentTools", () => {
	it("starts a thread with the supplied resume ID", async () => {
		const navigate = vi.fn();
		const tool = createAgentTools({ navigate }).find((item) => item.name === "rr.agent.start_thread");

		await tool?.execute({ resumeId: "resume-1" }, { signal: new AbortController().signal });

		expect(navigate).toHaveBeenCalledWith({ to: "/agent/new", search: { resumeId: "resume-1" } });
	});

	it("uses current resume ID when input omits one", async () => {
		const navigate = vi.fn();
		const tool = createAgentTools({ navigate, resumeId: "resume-current" }).find(
			(item) => item.name === "rr.agent.start_thread",
		);

		await tool?.execute({}, { signal: new AbortController().signal });

		expect(navigate).toHaveBeenCalledWith({ to: "/agent/new", search: { resumeId: "resume-current" } });
	});
});
