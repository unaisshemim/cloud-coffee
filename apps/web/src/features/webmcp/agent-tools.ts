import type { WebMcpTool } from "./types";
import { webMcpText } from "./results";

type NavigateAgent = (options: { to: "/agent/new"; search?: { resumeId?: string } }) => void | Promise<void>;

type CreateAgentToolsInput = {
	navigate: NavigateAgent;
	resumeId?: string | null;
};

export function createAgentTools({ navigate, resumeId }: CreateAgentToolsInput): WebMcpTool[] {
	return [
		{
			name: "rr.agent.start_thread",
			title: "Start Agent Thread",
			description: "Start a new Reactive Resume agent thread, optionally for a specific resume.",
			inputSchema: {
				type: "object",
				properties: { resumeId: { type: "string" } },
				additionalProperties: false,
			},
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: async (input) => {
				const inputResumeId =
					input && typeof input === "object" && "resumeId" in input && typeof input.resumeId === "string"
						? input.resumeId
						: undefined;
				const nextResumeId = inputResumeId ?? resumeId ?? undefined;

				await navigate({ to: "/agent/new", ...(nextResumeId ? { search: { resumeId: nextResumeId } } : {}) });

				return webMcpText("Opened new agent thread setup.");
			},
		},
	];
}
