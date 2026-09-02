import type { ResumeUpdatedEvent, SubscribeResumeUpdatedInput } from "./event-contracts";
import { getResumeEventRuntime } from "./event-runtime";

export type { ResumeUpdatedEvent } from "./event-contracts";

export function publishResumeUpdated(event: ResumeUpdatedEvent): Promise<void> {
	return getResumeEventRuntime().publish(event);
}

export function subscribeResumeUpdated(input: SubscribeResumeUpdatedInput): Promise<AsyncIterable<ResumeUpdatedEvent>> {
	// Capture the request runtime now; async iteration may happen after its creation scope exits.
	return Promise.resolve(getResumeEventRuntime().subscribe(input));
}
