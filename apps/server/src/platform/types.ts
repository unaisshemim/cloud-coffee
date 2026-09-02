import type { Context } from "hono";

export type TrustedClientResolver = (context: Context) => string;

export type ApiAppOptions = {
	getTrustedClient: TrustedClientResolver;
};
