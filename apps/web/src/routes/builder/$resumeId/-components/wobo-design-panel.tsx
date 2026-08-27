import { ArrowCounterClockwiseIcon, CaretDownIcon } from "@phosphor-icons/react";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";

const ACCENT_COLORS = [
	"rgba(0, 150, 137, 1)",
	"rgba(65, 184, 120, 1)",
	"rgba(53, 144, 201, 1)",
	"rgba(147, 83, 189, 1)",
	"rgba(239, 99, 88, 1)",
	"rgba(247, 169, 59, 1)",
	"rgba(224, 108, 48, 1)",
	"rgba(45, 45, 45, 1)",
] as const;

type SettingRowProps = {
	label: string;
	description?: string;
	children: React.ReactNode;
};

function SettingRow({ label, description, children }: SettingRowProps) {
	return (
		<div className="grid grid-cols-[190px_1fr] items-center gap-5">
			<div>
				<p className="font-semibold text-sm">{label}</p>
				{description && <p className="mt-1 text-[#7f7c8e] text-xs leading-5">{description}</p>}
			</div>
			{children}
		</div>
	);
}

export function WoboDesignPanel() {
	const resume = useCurrentResume();
	const updateResumeData = useUpdateResumeData();
	const { page, typography, design } = resume.data.metadata;

	const setPage = (field: "format" | "marginX" | "marginY", value: string | number) => {
		updateResumeData((draft) => {
			if (field === "format") draft.metadata.page.format = value as typeof page.format;
			else draft.metadata.page[field] = value as number;
		});
	};

	const setBodyTypography = (field: "fontFamily" | "fontSize" | "lineHeight", value: string | number) => {
		updateResumeData((draft) => {
			if (field === "fontFamily") draft.metadata.typography.body.fontFamily = value as string;
			else draft.metadata.typography.body[field] = value as number;
		});
	};

	return (
		<section className="h-full overflow-y-auto bg-[#fbf8f4] px-6 py-5 text-[#242337]">
			<div className="space-y-7">
				<div>
					<div className="mb-5 flex items-start justify-between">
						<div>
							<h1 className="font-semibold text-sm uppercase">Layout</h1>
							<p className="mt-1 text-[#817e8f] text-xs">Template, page size, and margins</p>
						</div>
						<button type="button" className="flex items-center gap-2 text-[#777487] text-xs">
							<ArrowCounterClockwiseIcon /> Reset
						</button>
					</div>

					<div className="mb-6">
						<p className="mb-3 font-semibold text-sm">Template</p>
						<div className="w-44 overflow-hidden rounded-md border-[#6255e7] border-[3px] bg-white p-1">
							<img
								src="/templates/jpg/treecko.jpg"
								alt="Treecko template"
								className="aspect-page w-full object-cover"
							/>
							<p className="py-1 text-center font-semibold text-xs">Treecko</p>
						</div>
					</div>

					<div className="space-y-6">
						<SettingRow label="Page Size">
							<label className="relative">
								<span className="sr-only">Page Size</span>
								<select
									aria-label="Page Size"
									value={page.format}
									onChange={(event) => setPage("format", event.target.value)}
									className="h-11 w-full appearance-none rounded-md border border-[#dedce3] bg-white px-4 text-sm"
								>
									<option value="a4">A4</option>
									<option value="letter">Letter</option>
									<option value="free-form">Free-form</option>
								</select>
								<CaretDownIcon className="pointer-events-none absolute top-3.5 right-4" />
							</label>
						</SettingRow>
						<SettingRow label="Top & Bottom Margin">
							<div className="flex items-center gap-4">
								<input
									aria-label="Top & Bottom Margin"
									type="range"
									min="0"
									max="72"
									value={page.marginY}
									onChange={(event) => setPage("marginY", Number(event.target.value))}
									className="w-full accent-[#6255e7]"
								/>
								<strong className="w-11 text-right text-sm">{page.marginY}pt</strong>
							</div>
						</SettingRow>
						<SettingRow label="Side Margins">
							<div className="flex items-center gap-4">
								<input
									aria-label="Side Margins"
									type="range"
									min="0"
									max="72"
									value={page.marginX}
									onChange={(event) => setPage("marginX", Number(event.target.value))}
									className="w-full accent-[#6255e7]"
								/>
								<strong className="w-11 text-right text-sm">{page.marginX}pt</strong>
							</div>
						</SettingRow>
					</div>
				</div>

				<div className="border-[#e5e0dc] border-t pt-6">
					<div className="mb-6 flex items-start justify-between">
						<div>
							<h2 className="font-semibold text-sm uppercase">Font & Format Settings</h2>
							<p className="mt-1 text-[#817e8f] text-xs">Typography, accent color, and date style</p>
						</div>
						<button type="button" className="flex items-center gap-2 text-[#777487] text-xs">
							<ArrowCounterClockwiseIcon /> Reset
						</button>
					</div>
					<div className="space-y-6">
						<SettingRow label="Font Family">
							<select
								aria-label="Font Family"
								value={typography.body.fontFamily}
								onChange={(event) => setBodyTypography("fontFamily", event.target.value)}
								className="h-11 rounded-md border border-[#dedce3] bg-white px-4 text-sm"
							>
								<option>Roboto</option>
								<option>Lato</option>
								<option>Montserrat</option>
								<option>Raleway</option>
								<option>IBM Plex Serif</option>
							</select>
						</SettingRow>
						<SettingRow label="Font Size">
							<select
								aria-label="Font Size"
								value={String(typography.body.fontSize)}
								onChange={(event) => setBodyTypography("fontSize", Number(event.target.value))}
								className="h-11 rounded-md border border-[#dedce3] bg-white px-4 text-sm"
							>
								{[8, 9, 10, 11, 12].map((size) => (
									<option key={size} value={size}>
										{size}
									</option>
								))}
							</select>
						</SettingRow>
						<SettingRow label="Line Height" description="Spacing between lines in summaries and bullets">
							<div className="flex items-center gap-4">
								<input
									aria-label="Line Height"
									type="range"
									min="0.8"
									max="2"
									step="0.05"
									value={typography.body.lineHeight}
									onChange={(event) => setBodyTypography("lineHeight", Number(event.target.value))}
									className="w-full accent-[#6255e7]"
								/>
								<strong className="w-11 text-right text-sm">{typography.body.lineHeight}x</strong>
							</div>
						</SettingRow>
						<SettingRow label="Accent Color" description="Colors your name and section headings">
							<div className="flex flex-wrap gap-2">
								{ACCENT_COLORS.map((color) => (
									<button
										key={color}
										type="button"
										aria-label={`Use accent ${color}`}
										onClick={() =>
											updateResumeData((draft) => {
												draft.metadata.design.colors.primary = color;
											})
										}
										className="size-9 rounded-full border-4 border-white shadow-sm ring-1 ring-[#dedce3]"
										style={{ backgroundColor: color }}
									>
										{design.colors.primary === color && <span className="text-white">✓</span>}
									</button>
								))}
							</div>
						</SettingRow>
						<SettingRow label="Date Format">
							<select
								aria-label="Date Format"
								defaultValue="01/2014"
								className="h-11 rounded-md border border-[#dedce3] bg-white px-4 text-sm"
							>
								<option value="01/2014">01/2014 (Number & Year)</option>
								<option value="Jan 2014">Jan 2014</option>
								<option value="January 2014">January 2014</option>
							</select>
						</SettingRow>
					</div>
				</div>
			</div>
		</section>
	);
}
