import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { findWorkspaceRoot } from "@reactive-resume/utils/monorepo.node";

function loadWorkspaceEnv() {
	const workspaceRoot = findWorkspaceRoot();
	if (!workspaceRoot) return;

	try {
		process.loadEnvFile(join(workspaceRoot, ".env"));
	} catch (error) {
		if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
	}
}

async function bootstrap() {
	loadWorkspaceEnv();
	await import("./node").then((module) => module.main());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	bootstrap().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
