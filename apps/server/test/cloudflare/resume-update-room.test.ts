import { describe, expect, it } from "vitest";
import { createDurableResumeEventRuntime } from "../../src/platform/resume-events";
import { evictDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";

const event = {
	type: "resume.updated" as const,
	resumeId: "resume-1",
	userId: "user-1",
	updatedAt: "2026-09-02T00:00:00.000Z",
	mutation: "update" as const,
};

describe("ResumeUpdateRoom", () => {
	it("accepts publishing with no subscribers", async () => {
		await expect(
			env.RESUME_UPDATES.getByName("empty-room").publish({ ...event, resumeId: "empty-room" }),
		).resolves.toBeUndefined();
	});
	it("fans one resume event out through runtime adapter", async () => {
		const runtime = createDurableResumeEventRuntime(env.RESUME_UPDATES);
		const controller = new AbortController();
		const iterator = (
			await runtime.subscribe({ resumeId: event.resumeId, userId: event.userId, signal: controller.signal })
		)[Symbol.asyncIterator]();
		const next = iterator.next();
		await runtime.publish(event);
		await expect(next).resolves.toEqual({ value: event, done: false });
		controller.abort();
		await iterator.return?.();
	});

	it("isolates rooms by resume ID", async () => {
		const runtime = createDurableResumeEventRuntime(env.RESUME_UPDATES);
		const controller = new AbortController();
		const iterator = (
			await runtime.subscribe({ resumeId: "resume-a", userId: event.userId, signal: controller.signal })
		)[Symbol.asyncIterator]();
		const pending = iterator.next();
		await runtime.publish({ ...event, resumeId: "resume-b" });
		controller.abort();
		await expect(pending).resolves.toEqual({ value: undefined, done: true });
	});

	it("survives Durable Object hibernation", async () => {
		const runtime = createDurableResumeEventRuntime(env.RESUME_UPDATES);
		const controller = new AbortController();
		const resumeId = "hibernate-resume";
		const iterator = (await runtime.subscribe({ resumeId, userId: event.userId, signal: controller.signal }))[
			Symbol.asyncIterator
		]();
		const first = iterator.next();
		await runtime.publish({ ...event, resumeId });
		await first;
		await evictDurableObject(env.RESUME_UPDATES.getByName(resumeId), { webSockets: "hibernate" });
		const second = iterator.next();
		await runtime.publish({ ...event, resumeId, mutation: "patch" });
		await expect(second).resolves.toMatchObject({ value: { mutation: "patch" } });
		controller.abort();
		await iterator.return?.();
	});

	it("rejects malformed events and events for another room", async () => {
		const stub = env.RESUME_UPDATES.getByName("validation-resume");
		await expect(async () => await stub.publish({ ...event, resumeId: "different-resume" })).rejects.toThrow(
			"Invalid resume update event",
		);
		await expect(
			async () => await stub.publish({ ...event, resumeId: "validation-resume", mutation: "invalid" } as never),
		).rejects.toThrow("Invalid resume update event");
	});

	it("broadcasts metadata only, even if caller supplies extra fields", async () => {
		const runtime = createDurableResumeEventRuntime(env.RESUME_UPDATES);
		const controller = new AbortController();
		const resumeId = "metadata-resume";
		const iterator = (await runtime.subscribe({ resumeId, userId: event.userId, signal: controller.signal }))[
			Symbol.asyncIterator
		]();
		const next = iterator.next();
		await env.RESUME_UPDATES.getByName(resumeId).publish({ ...event, resumeId, content: "secret" } as never);
		await expect(next).resolves.toEqual({ value: { ...event, resumeId }, done: false });
		controller.abort();
		await iterator.return?.();
	});

	it("reports unexpected disconnects so clients can reconnect", async () => {
		const runtime = createDurableResumeEventRuntime(env.RESUME_UPDATES);
		const resumeId = "disconnect-resume";
		const iterator = (await runtime.subscribe({ resumeId, userId: event.userId }))[Symbol.asyncIterator]();
		const first = iterator.next();
		await runtime.publish({ ...event, resumeId });
		await first;
		const pending = iterator.next();
		const assertion = expect(pending).rejects.toThrow("Resume update stream disconnected");
		await evictDurableObject(env.RESUME_UPDATES.getByName(resumeId), { webSockets: "close" });
		await assertion;
	});

	it("fans out to multiple subscribers and filters other users", async () => {
		const runtime = createDurableResumeEventRuntime(env.RESUME_UPDATES);
		const controller = new AbortController();
		const resumeId = "fanout-resume";
		const input = { resumeId, userId: event.userId, signal: controller.signal };
		const first = (await runtime.subscribe(input))[Symbol.asyncIterator]();
		const second = (await runtime.subscribe(input))[Symbol.asyncIterator]();
		const pending = [first.next(), second.next()];
		await runtime.publish({ ...event, resumeId, userId: "other-user" });
		await runtime.publish({ ...event, resumeId });
		for (const result of await Promise.all(pending)) expect(result.value).toEqual({ ...event, resumeId });
		controller.abort();
		await Promise.all([first.return?.(), second.return?.()]);
	});
});
