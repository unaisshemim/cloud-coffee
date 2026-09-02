import type { JWTPayload } from "jose";
import type { Auth, OAuthTokenVerifier } from "./config";
import { AsyncLocalStorage } from "node:async_hooks";

export type AuthRuntime = {
	auth: Auth;
	verifyOAuthToken: OAuthTokenVerifier;
};

const authRuntime = new AsyncLocalStorage<AuthRuntime>();
let defaultAuthRuntime: AuthRuntime | undefined;

export function setDefaultAuthRuntime(runtime: AuthRuntime): void {
	defaultAuthRuntime = runtime;
}

export function getAuthRuntime(): AuthRuntime {
	const runtime = authRuntime.getStore() ?? defaultAuthRuntime;
	if (!runtime) throw new Error("Auth runtime is not configured");
	return runtime;
}

export function getAuth(): Auth {
	return getAuthRuntime().auth;
}

export function verifyOAuthToken(token: string): Promise<JWTPayload> {
	return getAuthRuntime().verifyOAuthToken(token);
}

export function runWithAuthRuntime<T>(runtime: AuthRuntime, callback: () => T): T {
	return authRuntime.run(runtime, callback);
}
