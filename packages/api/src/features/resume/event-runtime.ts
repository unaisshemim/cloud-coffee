import type { ResumeUpdatedEvent, SubscribeResumeUpdatedInput } from "./event-contracts";
import { AsyncLocalStorage } from "node:async_hooks";

export type ResumeEventRuntime = {
	publish(event: ResumeUpdatedEvent): Promise<void>;
	subscribe(
		input: SubscribeResumeUpdatedInput,
	): AsyncIterable<ResumeUpdatedEvent> | Promise<AsyncIterable<ResumeUpdatedEvent>>;
};

const eventRuntime = new AsyncLocalStorage<ResumeEventRuntime>();
let defaultEventRuntime: ResumeEventRuntime | undefined;

export function setDefaultResumeEventRuntime(runtime: ResumeEventRuntime): void {
	defaultEventRuntime = runtime;
}

export function getResumeEventRuntime(): ResumeEventRuntime {
	const runtime = eventRuntime.getStore() ?? defaultEventRuntime;
	if (!runtime) throw new Error("Resume event runtime is not configured");
	return runtime;
}

export function runWithResumeEventRuntime<T>(runtime: ResumeEventRuntime, callback: () => T): T {
	return eventRuntime.run(runtime, callback);
}
