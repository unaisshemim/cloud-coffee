import type { PropsWithChildren } from "react";
import {
	ArrowRightIcon,
	BriefcaseIcon,
	CheckCircleIcon,
	ClockCounterClockwiseIcon,
	FileTextIcon,
	PlugsConnectedIcon,
	TargetIcon,
} from "@phosphor-icons/react";
import { m, useReducedMotion } from "motion/react";

const timelineItems = [
	{ date: "AUG 28", title: "Checkout redesign shipped", meta: "+18% conversion" },
	{ date: "JUL 09", title: "Hackathon winner", meta: "AI career copilot" },
	{ date: "MAY 16", title: "Platform migration", meta: "42% faster builds" },
] as const;

const evidenceItems = [
	{ label: "Growth experiment", section: "Experience", score: "+28" },
	{ label: "Platform migration", section: "Projects", score: "+19" },
	{ label: "Team leadership", section: "Summary", score: "+14" },
] as const;

const surfaceClassName =
	"group relative overflow-hidden rounded-[1.75rem] border border-[#ded8ca] bg-white shadow-[0_28px_80px_rgba(55,46,35,0.11),0_0_0_8px_rgba(239,234,247,0.5)]";

type SectionArtworkProps = {
	src: string;
	alt: string;
	position?: string;
};

function SectionArtwork({ src, alt, position = "object-center" }: SectionArtworkProps) {
	const reduceMotion = useReducedMotion();

	return (
		<div className="relative mx-5 mt-5 aspect-[16/7] overflow-hidden rounded-2xl bg-[#f5f1e8]">
			<m.img
				alt={alt}
				width={1672}
				height={941}
				loading="lazy"
				decoding="async"
				src={src}
				className={`size-full object-cover ${position}`}
				initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.02 }}
				whileInView={{ opacity: 1, scale: 1 }}
				viewport={{ once: true, amount: 0.35 }}
				transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
			/>
			<div className="pointer-events-none absolute inset-0 ring-1 ring-black/6 ring-inset" />
		</div>
	);
}

type WindowBarProps = { label: string };

function WindowBar({ label }: WindowBarProps) {
	return (
		<div className="flex h-12 items-center gap-2 border-[#ebe6dc] border-b px-5">
			<div className="flex gap-1.5" aria-hidden="true">
				<span className="size-2 rounded-full bg-[#ef7252]" />
				<span className="size-2 rounded-full bg-[#edc267]" />
				<span className="size-2 rounded-full bg-[#7abb8a]" />
			</div>
			<span className="mx-auto -translate-x-5 font-mono text-[#92918e] text-[9px] tracking-[0.12em]">{label}</span>
		</div>
	);
}

function CareerTimelineCard() {
	return (
		<m.article
			data-testid="product-ui-card"
			className={surfaceClassName}
			initial={{ opacity: 0, y: 26, rotate: -0.5 }}
			whileInView={{ opacity: 1, y: 0, rotate: 0 }}
			viewport={{ once: true, amount: 0.2 }}
			transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
		>
			<WindowBar label="CAREER MEMORY / TIMELINE" />
			<SectionArtwork
				alt="Editorial career milestones rising along an achievement timeline"
				src="/images/landing/career-timeline-art.webp"
				position="object-[52%_center]"
			/>
			<div className="p-5 sm:p-6">
				<div className="mb-5 flex items-center justify-between">
					<div>
						<p className="font-mono text-[#ef5a2f] text-[9px] uppercase tracking-[0.16em]">Memory updated</p>
						<h3 className="mt-1 font-medium text-xl tracking-[-0.035em]">Career timeline</h3>
					</div>
					<ClockCounterClockwiseIcon className="size-6 text-[#ef5a2f]" weight="thin" />
				</div>
				<div className="space-y-2.5">
					{timelineItems.map((item) => (
						<div
							key={item.title}
							className="grid grid-cols-[3.6rem_1fr_auto] items-center gap-3 rounded-xl bg-[#f8f6f1] px-3 py-3"
						>
							<span className="font-mono text-[#9b9993] text-[8px]">{item.date}</span>
							<div>
								<p className="font-medium text-[#242625] text-xs">{item.title}</p>
								<p className="mt-0.5 text-[#858580] text-[10px]">{item.meta}</p>
							</div>
							<CheckCircleIcon className="size-4 text-[#65a978]" weight="fill" />
						</div>
					))}
				</div>
			</div>
		</m.article>
	);
}

function WebMcpConnectionsCard() {
	const reduceMotion = useReducedMotion();

	return (
		<m.article
			data-testid="product-ui-card"
			className={surfaceClassName}
			initial={{ opacity: 0, y: 26, rotate: 0.5 }}
			whileInView={{ opacity: 1, y: 0, rotate: 0 }}
			viewport={{ once: true, amount: 0.2 }}
			transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
		>
			<WindowBar label="CLOUDCOFFEE / CONNECTIONS" />
			<SectionArtwork
				alt="Browser portal connecting career tools through WebMCP"
				src="/images/landing/webmcp-connections-art.webp"
				position="object-[48%_center]"
			/>
			<div className="p-5 sm:p-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="font-mono text-[#ef5a2f] text-[9px] uppercase tracking-[0.16em]">Browser-native tools</p>
						<h3 className="mt-1 font-medium text-xl tracking-[-0.035em]">WebMCP connections</h3>
					</div>
					<span className="flex items-center gap-1.5 rounded-full bg-[#edf6ef] px-3 py-1.5 font-mono text-[#4f855c] text-[8px] uppercase tracking-[0.1em]">
						<span className="size-1.5 rounded-full bg-[#62a773]" /> Connected
					</span>
				</div>
				<div className="relative mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-[#f7f5fa] p-4">
					<div className="space-y-2">
						{["Career base", "Applications", "Job links"].map((label) => (
							<div key={label} className="rounded-lg bg-white px-2.5 py-2 font-medium text-[9px] shadow-sm">
								{label}
							</div>
						))}
					</div>
					<m.div
						className="grid size-14 place-items-center rounded-2xl bg-[#ef5a2f] text-white shadow-[0_12px_24px_rgba(239,90,47,0.22)]"
						animate={reduceMotion ? undefined : { scale: [1, 1.05, 1] }}
						transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY }}
					>
						<PlugsConnectedIcon className="size-6" weight="duotone" />
					</m.div>
					<div className="space-y-2">
						{["read_resume", "score_match", "save_win"].map((label) => (
							<div key={label} className="rounded-lg bg-[#25283a] px-2.5 py-2 font-mono text-[8px] text-white">
								{label}()
							</div>
						))}
					</div>
				</div>
			</div>
		</m.article>
	);
}

function ResumeMatchingCard() {
	return (
		<m.article
			data-testid="product-ui-card"
			className={surfaceClassName}
			initial={{ opacity: 0, y: 26, rotate: -0.5 }}
			whileInView={{ opacity: 1, y: 0, rotate: 0 }}
			viewport={{ once: true, amount: 0.2 }}
			transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
		>
			<WindowBar label="RESUME / ROLE MATCH" />
			<SectionArtwork
				alt="Job requirements aligning with resume evidence and a high match score"
				src="/images/landing/resume-match-art.webp"
			/>
			<div className="grid gap-3 p-5 sm:grid-cols-[1fr_1.2fr] sm:p-6">
				<div className="rounded-2xl border border-[#ebe6dc] p-4">
					<div className="flex items-center gap-2 border-[#eee9df] border-b pb-3">
						<BriefcaseIcon className="size-4 text-[#ef5a2f]" />
						<div>
							<p className="font-medium text-xs">Senior Product Engineer</p>
							<p className="font-mono text-[#a09d97] text-[7px]">JOB DESCRIPTION</p>
						</div>
					</div>
					<div className="mt-3 space-y-2">
						{["Growth systems", "Platform ownership", "Team leadership"].map((skill) => (
							<div
								key={skill}
								className="flex items-center gap-2 rounded-lg bg-[#f7f5ef] px-2.5 py-2 font-medium text-[9px]"
							>
								<TargetIcon className="size-3 text-[#ef5a2f]" /> {skill}
							</div>
						))}
					</div>
				</div>
				<div className="rounded-2xl bg-[#292b3c] p-4 text-white">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-2">
							<FileTextIcon className="size-5 text-[#f59576]" weight="thin" />
							<h3 className="font-medium text-xs">Resume matching</h3>
						</div>
						<span className="font-medium text-2xl tracking-[-0.06em]">92%</span>
					</div>
					<div className="mt-4 space-y-2">
						{evidenceItems.map((item) => (
							<div
								key={item.label}
								className="grid grid-cols-[1fr_auto] items-center rounded-lg bg-white/8 px-3 py-2.5"
							>
								<div>
									<p className="font-medium text-[10px]">{item.label}</p>
									<p className="text-[8px] text-white/55">→ {item.section}</p>
								</div>
								<span className="font-mono text-[#f59576] text-[8px]">{item.score}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</m.article>
	);
}

type JourneyStepProps = PropsWithChildren<{
	index: number;
	eyebrow: string;
	title: string;
	description: string;
	reverse?: boolean;
}>;

function JourneyStep({ index, eyebrow, title, description, reverse = false, children }: JourneyStepProps) {
	return (
		<section
			data-testid="journey-step"
			className="relative grid items-center gap-10 py-16 md:grid-cols-2 md:gap-24 md:py-24"
		>
			<div className={`relative z-10 ${reverse ? "md:order-2" : ""}`}>
				<div className="mx-auto max-w-md text-center md:mx-0 md:text-start">
					<span className="inline-flex rounded-full bg-[#fff0e8] px-3 py-1.5 font-mono text-[#e65328] text-[9px] uppercase tracking-[0.16em]">
						Step {String(index).padStart(2, "0")} · {eyebrow}
					</span>
					<h3 className="mt-5 font-medium text-3xl leading-[1.02] tracking-[-0.05em] sm:text-4xl">{title}</h3>
					<p className="mt-5 text-[#6b6e6b] text-sm leading-7 sm:text-[15px]">{description}</p>
					<div className="mt-6 inline-flex items-center gap-2 font-medium text-[#df542c] text-xs">
						See it in action <ArrowRightIcon className="size-3.5" />
					</div>
				</div>
			</div>
			<div className={`relative z-10 ${reverse ? "md:order-1" : ""}`}>{children}</div>
			<span className="absolute top-1/2 left-1/2 z-20 hidden size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#fbfaf6] bg-[#ef5a2f] shadow-[0_0_0_1px_#ef5a2f] md:block" />
		</section>
	);
}

export function ProductShowcase() {
	const reduceMotion = useReducedMotion();

	return (
		<div className="overflow-hidden bg-[#fbfaf6] px-5 py-20 sm:px-8 md:py-28">
			<div className="mx-auto max-w-2xl text-center">
				<p className="font-mono text-[#e65328] text-[10px] uppercase tracking-[0.2em]">How cloudcoffee works</p>
				<h2 className="mt-5 text-balance font-medium text-4xl leading-[0.98] tracking-[-0.055em] sm:text-5xl md:text-6xl">
					From scattered work to a role-ready story.
				</h2>
				<p className="mx-auto mt-6 max-w-xl text-[#6b6e6b] text-[15px] leading-7">
					Capture your evidence once. Keep it connected. Shape it for every opportunity without rebuilding your history.
				</p>
			</div>

			<div className="relative mx-auto mt-14 max-w-6xl md:mt-20">
				<m.div
					data-testid="journey-path"
					aria-hidden="true"
					className="absolute top-24 bottom-24 left-1/2 hidden w-px origin-top bg-linear-to-b from-[#ef5a2f]/10 via-[#ef5a2f]/65 to-[#ef5a2f]/10 md:block"
					initial={{ scaleY: 0 }}
					whileInView={{ scaleY: 1 }}
					viewport={{ once: true, amount: 0.1 }}
					transition={{ duration: reduceMotion ? 0 : 1.8, ease: [0.22, 1, 0.36, 1] }}
				/>

				<JourneyStep
					index={1}
					eyebrow="Remember"
					title="Your wins become a living career timeline."
					description="Save launches, hackathons, migrations, metrics, and lessons while context is still fresh. Every entry stays searchable and useful."
				>
					<CareerTimelineCard />
				</JourneyStep>

				<JourneyStep
					index={2}
					eyebrow="Connect"
					title="WebMCP brings your work into one place."
					description="Connect browser-native tools and product sources. cloudcoffee can read your history, query evidence, and keep applications in sync."
					reverse
				>
					<WebMcpConnectionsCard />
				</JourneyStep>

				<JourneyStep
					index={3}
					eyebrow="Apply"
					title="One job link becomes your strongest resume."
					description="Paste a role. cloudcoffee maps its requirements to real evidence from your career base, then builds a focused resume with proof behind every claim."
				>
					<ResumeMatchingCard />
				</JourneyStep>
			</div>
		</div>
	);
}
