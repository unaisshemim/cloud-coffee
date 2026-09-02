import type { ResumeUpdatedEvent, SubscribeResumeUpdatedInput } from "./event-contracts";
import type { ResumeEventRuntime } from "./event-runtime";
import { getPool } from "@reactive-resume/db/client";
import { isResumeUpdatedEvent } from "./event-contracts";

const RESUME_UPDATED_CHANNEL = "resume_updated";

type PgNotification = {
	channel?: string | undefined;
	payload?: string | undefined;
};

export async function publishResumeUpdated(event: ResumeUpdatedEvent) {
	await getPool().query("SELECT pg_notify($1, $2)", [RESUME_UPDATED_CHANNEL, JSON.stringify(event)]);
}

export const nodeResumeEventRuntime: ResumeEventRuntime = {
	publish: publishResumeUpdated,
	subscribe: subscribeResumeUpdated,
};

export async function* subscribeResumeUpdated({ resumeId, userId, signal }: SubscribeResumeUpdatedInput) {
	const client = await getPool().connect();
	const queue: ResumeUpdatedEvent[] = [];
	let done = signal?.aborted ?? false;
	let wake: (() => void) | undefined;

	const resolveWake = () => {
		wake?.();
		wake = undefined;
	};

	const onAbort = () => {
		done = true;
		resolveWake();
	};

	const onNotification = (notification: PgNotification) => {
		if (notification.channel !== RESUME_UPDATED_CHANNEL || !notification.payload) return;

		try {
			const event = JSON.parse(notification.payload) as unknown;
			if (!isResumeUpdatedEvent(event)) return;
			if (event.resumeId !== resumeId || event.userId !== userId) return;

			queue.push(event);
			resolveWake();
		} catch {
			// Ignore malformed notifications; the refetch path is invalidation-only.
		}
	};

	signal?.addEventListener("abort", onAbort, { once: true });
	client.on("notification", onNotification);

	try {
		await client.query(`LISTEN ${RESUME_UPDATED_CHANNEL}`);

		const waitForNextEvent = async (): Promise<ResumeUpdatedEvent | null> => {
			if (done) return null;

			const event = queue.shift();
			if (event) return event;

			await new Promise<void>((resolve) => {
				wake = resolve;
			});

			return waitForNextEvent();
		};

		async function* streamEvents(): AsyncGenerator<ResumeUpdatedEvent> {
			const event = await waitForNextEvent();
			if (!event) return;

			yield event;
			yield* streamEvents();
		}

		yield* streamEvents();
	} finally {
		signal?.removeEventListener("abort", onAbort);
		client.off("notification", onNotification);

		try {
			await client.query(`UNLISTEN ${RESUME_UPDATED_CHANNEL}`);
		} finally {
			client.release();
		}
	}
}
