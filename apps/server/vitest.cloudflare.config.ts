import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";

export default defineConfig({
	plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.events.jsonc" } })],
	test: { include: ["test/cloudflare/**/*.test.ts"] },
});
