import { CheckIcon, DownloadSimpleIcon, MagicWandIcon } from "@phosphor-icons/react";
import { Button } from "@reactive-resume/ui/components/button";
import { cn } from "@reactive-resume/utils/style";
import { useCurrentResume, useResumeStore } from "@/features/resume/builder/draft";
import { ResumeDownloadDialog } from "@/features/resume/export/download-dialog";
import { ThemeToggleButton } from "@/features/theme/toggle-button";

export type BuilderMode = "content" | "design" | "analysis";

type WoboModeTabsProps = {
	mode: BuilderMode;
	onModeChange: (mode: BuilderMode) => void;
};

const MODES: BuilderMode[] = ["content", "design", "analysis"];

export function WoboModeTabs({ mode, onModeChange }: WoboModeTabsProps) {
	return (
		<div role="tablist" aria-label="Builder workspace" className="flex items-center gap-1">
			{MODES.map((value) => (
				<button
					key={value}
					type="button"
					role="tab"
					aria-selected={mode === value}
					onClick={() => onModeChange(value)}
					className={cn(
						"h-10 px-5 font-medium text-sm capitalize transition-colors",
						mode === value ? "rounded-full bg-[#f0ecfb] text-[#6255e7]" : "text-[#777487] hover:text-[#29283a]",
					)}
				>
					{value.charAt(0).toUpperCase() + value.slice(1)}
				</button>
			))}
		</div>
	);
}

type WoboBuilderHeaderProps = WoboModeTabsProps;

export function WoboBuilderHeader({ mode, onModeChange }: WoboBuilderHeaderProps) {
	const resume = useCurrentResume();
	const saveStatus = useResumeStore((state) => state.saveStatus);

	return (
		<header className="flex h-[72px] shrink-0 items-center justify-between border-[#e8e3df] border-b bg-[#fbf8f4] px-5">
			<div className="flex min-w-0 items-center gap-5">
				<div className="flex h-11 items-center gap-3 rounded-full border border-[#dedce3] bg-white px-3 shadow-sm">
					<div className="flex size-8 items-center justify-center rounded-full border-[#16b981] border-[3px] font-bold text-sm">
						86
					</div>
					<div className="pe-1 leading-tight">
						<p className="text-[#858396] text-[10px] uppercase">Score</p>
						<p className="font-semibold text-[#16a66f] text-xs">Excellent</p>
					</div>
				</div>
				<div className="h-8 w-px bg-[#e5e0dc]" />
				<WoboModeTabs mode={mode} onModeChange={onModeChange} />
			</div>

			<div className="flex items-center gap-3">
				<div className="flex h-10 items-center gap-2 rounded-full border border-[#dedce3] bg-white px-4 text-[#747386] text-sm">
					<CheckIcon className="text-[#16a66f]" />
					<span>{saveStatus === "saving" ? "Saving..." : saveStatus === "error" ? "Save failed" : "Saved"}</span>
				</div>
				<div className="flex h-10 items-center gap-2 rounded-full border border-[#cbc4ff] bg-white px-4 font-semibold text-[#29283a]">
					<MagicWandIcon className="text-[#6255e7]" />
					<span>14</span>
					<span className="font-normal text-[#858396] text-xs">AI</span>
				</div>
				<ResumeDownloadDialog
					resume={resume}
					trigger={(disabled) => (
						<Button
							disabled={disabled}
							className="h-11 rounded-full bg-[#1f1f32] px-6 font-semibold text-white hover:bg-[#323247]"
						>
							<DownloadSimpleIcon />
							Export PDF
						</Button>
					)}
				/>
				<ThemeToggleButton size="icon" variant="ghost" className="text-[#777487]" />
			</div>
		</header>
	);
}
