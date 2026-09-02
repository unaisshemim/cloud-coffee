import type {
	ResumeUpdatedEvent,
	SubscribeResumeUpdatedInput,
} from "@reactive-resume/api/features/resume/event-contracts";
import type { ResumeEventRuntime } from "@reactive-resume/api/features/resume/event-runtime";
import type { ResumeUpdateRoom } from "./resume-update-room";
import { isResumeUpdatedEvent } from "@reactive-resume/api/features/resume/event-contracts";

export type ResumeUpdateNamespace = DurableObjectNamespace<ResumeUpdateRoom>;
const MAX_PENDING_EVENTS = 32;

function createSocketIterator(
	socket: WebSocket,
	{ resumeId, userId, signal }: SubscribeResumeUpdatedInput,
): AsyncIterable<ResumeUpdatedEvent> {
	const queue: ResumeUpdatedEvent[] = [];
	let done = false;
	let failure: Error | undefined;
	let wake: (() => void) | undefined;

	const resolveWake = () => {
		wake?.();
		wake = undefined;
	};
	const close = (error?: Error) => {
		if (done) return;
		done = true;
		failure = error;
		if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
			socket.close(1000, "Closed");
		resolveWake();
	};
	const onAbort = () => close();
	const onDisconnect = () => close(signal?.aborted ? undefined : new Error("Resume update stream disconnected"));
	const onMessage = (message: MessageEvent) => {
		if (done) return;
		try {
			const value = JSON.parse(String(message.data)) as unknown;
			if (!isResumeUpdatedEvent(value) || value.resumeId !== resumeId || value.userId !== userId) return;
			// Events only invalidate canonical data. Keep newest event if a reader falls behind.
			if (queue.length === MAX_PENDING_EVENTS) queue[queue.length - 1] = value;
			else queue.push(value);
			resolveWake();
		} catch {
			// Ignore malformed invalidation messages.
		}
	};

	socket.addEventListener("message", onMessage);
	socket.addEventListener("close", onDisconnect, { once: true });
	socket.addEventListener("error", onDisconnect, { once: true });
	signal?.addEventListener("abort", onAbort, { once: true });
	socket.accept();
	if (signal?.aborted) close();

	return {
		async *[Symbol.asyncIterator]() {
			try {
				while (true) {
					if (failure) throw failure;
					if (done) return;
					const event = queue.shift();
					if (event) {
						yield event;
						continue;
					}
					await new Promise<void>((resolve) => {
						wake = resolve;
					});
				}
			} finally {
				socket.removeEventListener("message", onMessage);
				socket.removeEventListener("close", onDisconnect);
				socket.removeEventListener("error", onDisconnect);
				signal?.removeEventListener("abort", onAbort);
				close();
			}
		},
	};
}

export function createDurableResumeEventRuntime(namespace: ResumeUpdateNamespace): ResumeEventRuntime {
	return {
		async publish(event) {
			await namespace.getByName(event.resumeId).publish(event);
		},
		async subscribe(input) {
			const response = await namespace.getByName(input.resumeId).fetch(
				new Request("https://resume-updates.internal/subscribe", {
					headers: { Upgrade: "websocket" },
					...(input.signal ? { signal: input.signal } : {}),
				}),
			);
			if (!response.webSocket) throw new Error(`Resume update subscription failed (${response.status})`);
			return createSocketIterator(response.webSocket, input);
		},
	};
}
