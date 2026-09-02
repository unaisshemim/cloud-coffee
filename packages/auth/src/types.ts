import type { Auth } from "./config";

export type AuthSession = {
	session: Auth["$Infer"]["Session"]["session"];
	user: Auth["$Infer"]["Session"]["user"];
};

// ponytail: plain union replaces z.enum solely used for type inference
export type AuthProvider = "google";
