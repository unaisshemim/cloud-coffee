import type { BuilderLayout } from "./-store/sidebar";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useMediaQuery } from "usehooks-ts";
import { useBuilderResumeUpdateSubscription, useResumeCleanup, useResumeStore } from "@/features/resume/builder/draft";
import { createBuilderTools } from "@/features/webmcp/builder-tools";
import { createPageDescriptionTool } from "@/features/webmcp/page-tools";
import { createWebMcpParityTools } from "@/features/webmcp/parity-tools";
import { useWebMcpTools } from "@/features/webmcp/use-webmcp-tools";
import { orpc } from "@/libs/orpc/client";
import { createNoindexFollowMeta } from "@/libs/seo";
import { DesktopBuilderShell } from "./-components/desktop-builder-shell";
import { SMALL_SCREEN_MEDIA_QUERY, SmallScreenNotice } from "./-components/small-screen-notice";
import { getBuilderLayout } from "./-store/sidebar";

export const Route = createFileRoute("/builder/$resumeId")({
	component: RouteComponent,
	beforeLoad: ({ context }) => {
		if (!context.session) throw redirect({ to: "/auth/login", replace: true });
		return { session: context.session };
	},
	loader: async ({ params, context }) => {
		const [layout, resume] = await Promise.all([
			getBuilderLayout(),
			context.queryClient.ensureQueryData(orpc.resume.getById.queryOptions({ input: { id: params.resumeId } })),
		]);

		return { layout, name: resume.name };
	},
	head: ({ loaderData }) => ({
		meta: loaderData
			? [{ title: `${loaderData.name} - cloudcoffee` }, createNoindexFollowMeta()]
			: [createNoindexFollowMeta()],
	}),
});

function RouteComponent() {
	const { layout: initialLayout } = Route.useLoaderData();

	const { resumeId } = Route.useParams();
	const { data: resume } = useSuspenseQuery(orpc.resume.getById.queryOptions({ input: { id: resumeId } }));
	const initializeResumeStore = useResumeStore((state) => state.initialize);
	const mergeResumeMetadata = useResumeStore((state) => state.mergeResumeMetadata);
	const isReady = useResumeStore((state) => state.isReady);
	const initializedResumeId = useResumeStore((state) => state.resumeId);
	const isInitialized = isReady && initializedResumeId === resumeId;
	const webMcpTools = useMemo(
		() => [
			createPageDescriptionTool({
				page: "resume-builder",
				route: "/builder/$resumeId",
				params: { resumeId },
				capabilities: [
					"rr.builder.read_current_resume",
					"rr.builder.apply_patch",
					"rr.builder.undo",
					"rr.builder.redo",
					"existing-mcp-parity",
				],
			}),
			...createBuilderTools(),
			...createWebMcpParityTools(),
		],
		[resumeId],
	);

	useResumeCleanup();
	useBuilderResumeUpdateSubscription();
	useWebMcpTools(webMcpTools, isInitialized);

	useEffect(() => {
		if (isInitialized) return;
		initializeResumeStore(resume);
	}, [initializeResumeStore, isInitialized, resume]);

	useEffect(() => {
		mergeResumeMetadata(resume);
	}, [
		mergeResumeMetadata,
		resume.id,
		resume.name,
		resume.slug,
		resume.tags,
		resume.isLocked,
		resume.isPublic,
		resume.hasPassword,
		resume.updatedAt,
		resume,
	]);

	if (!isInitialized) return null;

	return <BuilderLayoutShell initialLayout={initialLayout} />;
}

function BuilderLayoutShell({ initialLayout }: { initialLayout: BuilderLayout }) {
	// Mobile and tablet layouts are intentionally blocked; full editor starts at desktop width.
	const isMobileOrTablet = useMediaQuery(SMALL_SCREEN_MEDIA_QUERY, { initializeWithValue: false });

	if (isMobileOrTablet) return <SmallScreenNotice />;
	return <DesktopBuilderShell initialLayout={initialLayout} />;
}
