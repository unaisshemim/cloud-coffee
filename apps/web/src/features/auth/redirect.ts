export function resolveAuthRedirect(value: unknown): string {
	if (typeof value !== "string") return "/dashboard";
	if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";

	return value;
}
