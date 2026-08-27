import type { LeftSidebarSection } from "@/libs/resume/section";
import type { BuilderLayout } from "../-store/sidebar";
import type { BuilderMode } from "./wobo-builder-header";
import { Trans } from "@lingui/react/macro";
import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { SidebarProvider } from "@reactive-resume/ui/components/sidebar";
import { DashboardSidebar } from "../../../dashboard/-components/sidebar";
import { WoboAnalysisPanel } from "./wobo-analysis-panel";
import { WoboBuilderHeader } from "./wobo-builder-header";
import { WoboContentPanel } from "./wobo-content-panel";
import { WoboDesignPanel } from "./wobo-design-panel";

export type BuilderLayoutShellProps = {
	initialLayout: BuilderLayout;
};

export function DesktopBuilderShell({ initialLayout: _initialLayout }: BuilderLayoutShellProps) {
	const [mode, setMode] = useState<BuilderMode>("content");
	const [focusedSection, setFocusedSection] = useState<LeftSidebarSection | null>(null);

	const openSection = (section: LeftSidebarSection) => {
		setMode("content");
		setFocusedSection(section);
	};

	return (
		<SidebarProvider className="h-svh min-h-0 overflow-hidden bg-[#fbf8f4]">
			<a
				href="#main-content"
				className="sr-only rounded-md bg-popover px-4 py-2 text-sm ring-2 ring-ring focus:not-sr-only focus:absolute focus:inset-s-2 focus:top-2 focus:z-[100]"
			>
				<Trans>Skip to main content</Trans>
			</a>

			<DashboardSidebar />

			<div className="flex min-w-0 flex-1 flex-col">
				<WoboBuilderHeader mode={mode} onModeChange={setMode} />

				<div className="grid min-h-0 flex-1 grid-cols-[42%_58%]">
					<section className="min-h-0 border-[#e8e3df] border-r bg-[#fbf8f4]">
						{mode === "design" ? (
							<WoboDesignPanel />
						) : (
							<WoboContentPanel focusedSection={focusedSection} onFocusedSectionChange={setFocusedSection} />
						)}
					</section>
					<main id="main-content" className="relative min-h-0 overflow-hidden">
						{mode === "analysis" ? <WoboAnalysisPanel onOpenSection={openSection} /> : <Outlet />}
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}
