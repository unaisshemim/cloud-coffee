import type { ResumeEventRuntime } from "./event-runtime";
import { describe, expect, it, vi } from "vitest";
import { getResumeEventRuntime, runWithResumeEventRuntime, setDefaultResumeEventRuntime } from "./event-runtime";
import { publishResumeUpdated, subscribeResumeUpdated } from "./events";

const event = {
	type: "resume.updated" as const,
	resumeId: "resume-1",
	userId: "user-1",
	updatedAt: "2026-09-02T00:00:00.000Z",
	mutation: "update" as const,
};

function createRuntime(): ResumeEventRuntime {
	return {
		publish: vi.fn(() => Promise.resolve()),
		subscribe: vi.fn(async function* () {
			await Promise.resolve();
			yield event;
		}),
	};
}

describe("resume event runtime", () => {
	it("throws when no runtime is configured", () => {
		expect(() => getResumeEventRuntime()).toThrow("Resume event runtime is not configured");
	});

	it("supports defaults and nested scopes", () => {
		const fallback = createRuntime();
		const first = createRuntime();
		const second = createRuntime();
		setDefaultResumeEventRuntime(fallback);
		expect(getResumeEventRuntime()).toBe(fallback);
		runWithResumeEventRuntime(first, () => {
			runWithResumeEventRuntime(second, () => expect(getResumeEventRuntime()).toBe(second));
			expect(getResumeEventRuntime()).toBe(first);
		});
		expect(getResumeEventRuntime()).toBe(fallback);
	});

	it("forwards publishing and captures subscription runtime before iteration", async () => {
		const runtime = createRuntime();
		const input = { resumeId: event.resumeId, userId: event.userId };
		const events = await runWithResumeEventRuntime(runtime, async () => {
			await publishResumeUpdated(event);
			return subscribeResumeUpdated(input);
		});
		const received = [];
		for await (const value of events) received.push(value);
		expect(received).toEqual([event]);
		expect(runtime.publish).toHaveBeenCalledWith(event);
		expect(runtime.subscribe).toHaveBeenCalledWith(input);
	});

	it("isolates concurrent scopes", async () => {
		const first = createRuntime();
		const second = createRuntime();
		await Promise.all(
			[first, second].map((runtime) =>
				runWithResumeEventRuntime(runtime, async () => {
					await Promise.resolve();
					expect(getResumeEventRuntime()).toBe(runtime);
				}),
			),
		);
	});
});
