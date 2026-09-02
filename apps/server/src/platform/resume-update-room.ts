import type { ResumeUpdatedEvent } from "@reactive-resume/api/features/resume/event-contracts";
import { isResumeUpdatedEvent } from "@reactive-resume/api/features/resume/event-contracts";
import { DurableObject } from "cloudflare:workers";

export class ResumeUpdateRoom extends DurableObject {
	fetch(request: Request): Response {
		if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
			return new Response("Expected WebSocket", { status: 426 });
		}

		const pair = new WebSocketPair();
		this.ctx.acceptWebSocket(pair[1]);
		return new Response(null, { status: 101, webSocket: pair[0] });
	}

	publish(event: ResumeUpdatedEvent): void {
		if (!isResumeUpdatedEvent(event) || event.resumeId !== this.ctx.id.name) {
			throw new TypeError("Invalid resume update event");
		}
		const message = JSON.stringify({
			type: event.type,
			resumeId: event.resumeId,
			userId: event.userId,
			updatedAt: event.updatedAt,
			mutation: event.mutation,
		});
		for (const socket of this.ctx.getWebSockets()) {
			try {
				socket.send(message);
			} catch {
				socket.close(1011, "Publish failed");
			}
		}
	}

	webSocketMessage(socket: WebSocket): void {
		// Subscriptions are read-only. Publishing is private Worker-to-DO RPC only.
		socket.close(1008, "Read-only subscription");
	}
}
