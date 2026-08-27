import type { LeftSidebarSection } from "@/libs/resume/section";
import { ArrowRightIcon, CaretDownIcon, InfoIcon } from "@phosphor-icons/react";

type WoboAnalysisPanelProps = {
	onOpenSection: (section: LeftSidebarSection) => void;
};

const SCORE_ROWS = [
	{ label: "Content Quality", value: "21/28", width: "75%", tone: "bg-[#6255e7]" },
	{ label: "Completeness", value: "17/18", width: "94%", tone: "bg-[#18b882]" },
	{ label: "Structure", value: "11/14", width: "79%", tone: "bg-[#6255e7]" },
	{ label: "Language", value: "11/11", width: "100%", tone: "bg-[#18b882]" },
	{ label: "ATS", value: "28/30", width: "94%", tone: "bg-[#18b882]" },
] as const;

const SUGGESTIONS = [
	{ section: "publications" as const, item: "SFS", title: "Add the publication year for ‘sfs’", copy: "Add the date." },
	{
		section: "experience" as const,
		item: "WORK EXPERIENCE",
		title: "Strengthen one achievement",
		copy: "Add a measurable outcome to the role.",
	},
] as const;

export function WoboAnalysisPanel({ onOpenSection }: WoboAnalysisPanelProps) {
	return (
		<section className="h-full overflow-y-auto bg-[#fbf8f4] p-6 text-[#242337]">
			<div className="mx-auto max-w-5xl space-y-5">
				<div className="flex items-center gap-5">
					<div className="flex size-24 shrink-0 flex-col items-center justify-center rounded-full border-[#18b882] border-[10px] bg-white">
						<strong className="text-3xl">86</strong>
						<span className="text-[#8a8897] text-[10px]">OF 100</span>
					</div>
					<div>
						<p className="font-semibold text-lg">
							<span className="text-[#6255e7]">+2 pts</span> recoverable
						</p>
						<p className="mt-1 text-[#868394] text-sm">4 suggestions · Excellent · +12 behind quick fixes</p>
					</div>
				</div>

				<div className="rounded-md border border-[#dedce3] bg-white">
					<div className="flex items-center gap-3 border-[#ebe7e4] border-b px-5 py-4">
						<CaretDownIcon />
						<div>
							<h2 className="font-semibold text-sm uppercase">Score Breakdown</h2>
							<p className="text-[#8a8897] text-xs">Click a category to jump to its suggestions below</p>
						</div>
					</div>
					<div className="space-y-5 p-5">
						{SCORE_ROWS.map((row) => (
							<div key={row.label} className="grid grid-cols-[180px_1fr_64px_16px] items-center gap-4 text-sm">
								<span className="text-[#747386]">{row.label}</span>
								<div className="h-2 overflow-hidden rounded-full bg-[#e9e7e6]">
									<div className={`h-full rounded-full ${row.tone}`} style={{ width: row.width }} />
								</div>
								<strong className="text-right text-xs">{row.value}</strong>
								<CaretDownIcon className="text-[#a3a0ad]" />
							</div>
						))}
					</div>
				</div>

				<div className="flex gap-2">
					{["All 4", "Publications 2", "Work Experience 2"].map((filter, index) => (
						<button
							key={filter}
							type="button"
							className={
								index === 0
									? "rounded-full bg-[#242337] px-4 py-2 text-white text-xs"
									: "rounded-full border border-[#dedce3] bg-white px-4 py-2 text-[#747386] text-xs"
							}
						>
							{filter}
						</button>
					))}
				</div>

				{SUGGESTIONS.map((suggestion) => (
					<article key={suggestion.title} className="rounded-md border border-[#cce8fa] bg-[#f7fbfe] p-5">
						<div className="flex gap-4">
							<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dcf2ff] text-[#1194d1]">
								<InfoIcon />
							</div>
							<div className="min-w-0 flex-1">
								<p className="font-semibold text-[#9a98a7] text-xs uppercase">{suggestion.item}</p>
								<h3 className="mt-1 font-semibold">{suggestion.title}</h3>
								<p className="mt-3 text-[#868394] text-sm italic">{suggestion.copy}</p>
								<div className="mt-5 flex items-center justify-between">
									<span className="text-[#8b8998] text-xs uppercase">Completeness</span>
									<button
										type="button"
										onClick={() => onOpenSection(suggestion.section)}
										className="flex h-9 items-center gap-2 rounded-full border border-[#dedce3] bg-white px-4 font-semibold text-xs"
									>
										Open in editor <ArrowRightIcon />
									</button>
								</div>
							</div>
							<span className="rounded-full bg-[#dff4ff] px-3 py-1 font-semibold text-[#087bb4] text-xs">+1 pt</span>
						</div>
					</article>
				))}
			</div>
		</section>
	);
}
