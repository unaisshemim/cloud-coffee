import type { WebMcpTool } from "./types";
import { useEffect } from "react";
import { registerWebMcpTools } from "./register";

export function useWebMcpTools(tools: WebMcpTool[], enabled = true): void {
	useEffect(() => {
		if (!enabled) return;

		const registration = registerWebMcpTools(tools);
		return registration.unregister;
	}, [enabled, tools]);
}
