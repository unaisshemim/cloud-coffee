const resumeMutationNames = new Set(["sync", "create", "update", "patch", "lock", "password", "delete"] as const);

export type ResumeUpdatedEvent = {
	type: "resume.updated";
	resumeId: string;
	userId: string;
	updatedAt: string;
	mutation: "sync" | "create" | "update" | "patch" | "lock" | "password" | "delete";
};

export type SubscribeResumeUpdatedInput = {
	resumeId: string;
	userId: string;
	signal?: AbortSignal;
};

export function isResumeUpdatedEvent(value: unknown): value is ResumeUpdatedEvent {
	if (!value || typeof value !== "object") return false;
	const event = value as Partial<ResumeUpdatedEvent>;
	return (
		event.type === "resume.updated" &&
		typeof event.resumeId === "string" &&
		typeof event.userId === "string" &&
		typeof event.updatedAt === "string" &&
		typeof event.mutation === "string" &&
		resumeMutationNames.has(event.mutation as ResumeUpdatedEvent["mutation"])
	);
}
