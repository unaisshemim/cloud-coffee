import {
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

const webMcpTools = ["read_resume", "list_applications", "score_match"] as const;

const evidenceItems = [
	{ label: "Growth experiment", section: "Experience", score: "+28" },
	{ label: "Platform migration", section: "Projects", score: "+19" },
	{ label: "Team leadership", section: "Summary", score: "+14" },
] as const;

const cardClassName =
	"relative overflow-hidden rounded-[1.4rem] border border-[#c9c0ae] bg-[#fbf8f0] shadow-[0_22px_70px_rgba(46,42,34,0.08)]";

function CareerTimelineCard() {
	const reduceMotion = useReducedMotion();

	return (
		<m.article
			data-testid="product-ui-card"
			className={`${cardClassName} p-5 sm:p-7 lg:col-span-5`}
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.2 }}
			transition={{ duration: 0.55 }}
		>
			<div className="flex items-center justify-between border-[#d9d0bf] border-b pb-5">
				<div>
					<p className="font-bold font-mono text-[#778086] text-[10px] uppercase tracking-[0.18em]">memory.stream</p>
					<h3 className="mt-1 font-bold text-2xl tracking-[-0.04em]">Career timeline</h3>
				</div>
				<ClockCounterClockwiseIcon className="size-7 text-[#f1530a]" weight="thin" />
			</div>

			<div className="relative mt-7">
				<m.div
					aria-hidden="true"
					className="absolute top-2 bottom-4 left-[4.5rem] w-px origin-top bg-[#f1530a]/55"
					initial={{ scaleY: 0 }}
					whileInView={{ scaleY: 1 }}
					viewport={{ once: true }}
					transition={{ duration: reduceMotion ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
				/>
				<div className="space-y-5">
					{timelineItems.map((item, index) => (
						<m.div
							key={item.title}
							className="relative grid grid-cols-[3.4rem_1rem_1fr] items-center gap-3"
							animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: [0.45, 1, 1, 0.45], y: [5, 0, 0, 5] }}
							transition={{
								duration: 5.4,
								delay: index * 0.7,
								repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
								repeatDelay: 1.3,
							}}
						>
							<span className="font-bold font-mono text-[#778086] text-[9px] tracking-[0.08em]">{item.date}</span>
							<span className="relative z-10 size-3 rounded-full border-2 border-[#fbf8f0] bg-[#f1530a] shadow-[0_0_0_1px_#f1530a]" />
							<div className="rounded-xl border border-[#d9d0bf] bg-white/80 p-3">
								<p className="font-bold text-[#232627] text-sm">{item.title}</p>
								<p className="mt-1 font-mono text-[#687176] text-[10px]">{item.meta}</p>
							</div>
						</m.div>
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
			className={`${cardClassName} min-h-[26rem] p-5 sm:p-7 lg:col-span-7`}
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.2 }}
			transition={{ duration: 0.55, delay: 0.08 }}
		>
			<div className="flex items-center justify-between">
				<div>
					<p className="font-bold font-mono text-[#778086] text-[10px] uppercase tracking-[0.18em]">browser.tools</p>
					<h3 className="mt-1 font-bold text-2xl tracking-[-0.04em]">WebMCP connections</h3>
				</div>
				<span className="inline-flex items-center gap-2 rounded-full border border-[#b9d2bd] bg-[#eaf4e8] px-3 py-1.5 font-bold font-mono text-[#35623e] text-[9px] uppercase tracking-[0.12em]">
					<span className="relative flex size-2">
						{!reduceMotion ? (
							<m.span
								className="absolute inline-flex size-full rounded-full bg-[#4c9a5d] opacity-70"
								animate={{ scale: [1, 1.9], opacity: [0.65, 0] }}
								transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
							/>
						) : null}
						<span className="relative inline-flex size-2 rounded-full bg-[#4c9a5d]" />
					</span>
					connected
				</span>
			</div>

			<div className="relative mt-8 grid min-h-64 grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
				<div className="space-y-3">
					{["Career base", "Applications", "Job descriptions"].map((label, index) => (
						<m.div
							key={label}
							className="rounded-xl border border-[#d9d0bf] bg-white/75 px-3 py-3 font-bold text-[11px] sm:text-xs"
							animate={reduceMotion ? { x: 0 } : { x: [0, 3, 0] }}
							transition={{ duration: 3.2, delay: index * 0.35, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY }}
						>
							{label}
						</m.div>
					))}
				</div>

				<div className="relative z-10 grid size-20 place-items-center rounded-2xl border border-[#f1530a]/40 bg-[#fff0e9] shadow-[0_12px_30px_rgba(241,83,10,0.16)] sm:size-24">
					<PlugsConnectedIcon className="size-8 text-[#f1530a]" weight="duotone" />
					<span className="absolute -bottom-7 whitespace-nowrap font-bold font-mono text-[#f1530a] text-[9px] tracking-[0.1em]">
						WEBMCP.CONNECT
					</span>
				</div>

				<div className="space-y-3">
					{webMcpTools.map((tool, index) => (
						<m.div
							key={tool}
							className="rounded-xl border border-[#d9d0bf] bg-[#172333] px-2 py-3 font-mono text-[7px] text-white sm:px-3 sm:text-[10px]"
							animate={reduceMotion ? { opacity: 1 } : { opacity: [0.42, 1, 0.42] }}
							transition={{ duration: 3, delay: index * 0.45, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY }}
						>
							{tool}()
						</m.div>
					))}
				</div>

				<div aria-hidden="true" className="pointer-events-none absolute inset-0">
					<svg className="size-full" viewBox="0 0 600 250" preserveAspectRatio="none">
						<title>Animated WebMCP connection paths</title>
						{[70, 125, 180].map((y, index) => (
							<m.path
								key={y}
								d={`M 145 ${y} C 220 ${y}, 210 125, 275 125 M 325 125 C 390 125, 380 ${y}, 455 ${y}`}
								fill="none"
								stroke="#f1530a"
								strokeOpacity="0.32"
								strokeWidth="1.5"
								strokeDasharray="5 7"
								animate={reduceMotion ? undefined : { strokeDashoffset: [24, 0] }}
								transition={{ duration: 2.2, delay: index * 0.18, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
							/>
						))}
					</svg>
				</div>
			</div>
		</m.article>
	);
}

function ResumeMatchingCard() {
	const reduceMotion = useReducedMotion();

	return (
		<m.article
			data-testid="product-ui-card"
			className={`${cardClassName} p-5 sm:p-7 lg:col-span-12`}
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.18 }}
			transition={{ duration: 0.55 }}
		>
			<div className="flex flex-col justify-between gap-3 border-[#d9d0bf] border-b pb-5 sm:flex-row sm:items-end">
				<div>
					<p className="font-bold font-mono text-[#778086] text-[10px] uppercase tracking-[0.18em]">resume.fit</p>
					<h3 className="mt-1 font-bold text-2xl tracking-[-0.04em]">Resume matching</h3>
				</div>
				<p className="max-w-md text-[#687176] text-sm leading-relaxed">
					Watch evidence from your career base map itself to the role that needs it.
				</p>
			</div>

			<div className="mt-7 grid gap-5 lg:grid-cols-[0.8fr_1.2fr_0.72fr] lg:items-stretch">
				<div className="rounded-2xl border border-[#d9d0bf] bg-white/75 p-4">
					<div className="flex items-center gap-2 border-[#e3dccf] border-b pb-3">
						<BriefcaseIcon className="size-5 text-[#f1530a]" />
						<div>
							<p className="font-bold text-sm">Senior Product Engineer</p>
							<p className="font-mono text-[#778086] text-[9px]">JOB DESCRIPTION</p>
						</div>
					</div>
					<div className="mt-4 space-y-2">
						{["Growth systems", "Platform ownership", "Team leadership"].map((skill, index) => (
							<m.div
								key={skill}
								className="flex items-center gap-2 rounded-lg bg-[#f1ecdf] px-3 py-2 font-bold text-[10px]"
								animate={reduceMotion ? { opacity: 1 } : { opacity: [0.5, 1, 1] }}
								transition={{ duration: 4, delay: index * 0.45, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY }}
							>
								<TargetIcon className="size-3.5 text-[#f1530a]" /> {skill}
							</m.div>
						))}
					</div>
				</div>

				<div className="space-y-3 rounded-2xl border border-[#d9d0bf] bg-[#f7f3e9] p-4">
					{evidenceItems.map((item, index) => (
						<m.div
							key={item.label}
							className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-[#d9d0bf] bg-white/85 p-3"
							animate={reduceMotion ? { x: 0 } : { x: [0, 4, 0] }}
							transition={{ duration: 4.6, delay: index * 0.55, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY }}
						>
							<div>
								<p className="font-bold text-sm">{item.label}</p>
								<p className="mt-1 font-mono text-[#778086] text-[9px]">→ {item.section}</p>
							</div>
							<span className="rounded-full bg-[#fff0e9] px-2 py-1 font-bold font-mono text-[#f1530a] text-[9px]">
								{item.score}
							</span>
						</m.div>
					))}
				</div>

				<div className="flex min-h-52 flex-col justify-between rounded-2xl bg-[#172333] p-5 text-white">
					<div className="flex items-start justify-between">
						<FileTextIcon className="size-6 text-[#ff8a66]" weight="thin" />
						<CheckCircleIcon className="size-5 text-[#79c98b]" weight="fill" />
					</div>
					<div>
						<div className="flex items-end justify-between gap-3">
							<span className="font-bold text-5xl tracking-[-0.07em]">92%</span>
							<span className="pb-1 font-bold font-mono text-[#aeb9c5] text-[9px]">MATCH SCORE</span>
						</div>
						<div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/12">
							<m.div
								className="h-full origin-left rounded-full bg-[#ff6333]"
								initial={{ scaleX: reduceMotion ? 0.92 : 0 }}
								whileInView={{ scaleX: 0.92 }}
								viewport={{ once: true }}
								transition={{ duration: reduceMotion ? 0 : 1.4, ease: [0.22, 1, 0.36, 1] }}
							/>
						</div>
					</div>
				</div>
			</div>
		</m.article>
	);
}

export function ProductShowcase() {
	return (
		<div className="border-[#c9c0ae] border-b bg-[#eee7d8] px-4 py-16 sm:px-6 md:px-10 md:py-24">
			<m.div
				className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]"
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.5 }}
			>
				<p className="font-bold font-mono text-[#5f6c71] text-xs uppercase tracking-[0.2em]">01 / Product flows</p>
				<div>
					<h2 className="max-w-3xl font-bold text-4xl leading-[0.98] tracking-[-0.055em] md:text-6xl">
						See your career base think.
					</h2>
					<p className="mt-6 max-w-2xl text-[#555c5f] leading-relaxed md:text-lg">
						Every saved win becomes usable evidence. WebMCP keeps it connected, searchable, and ready for the next role.
					</p>
				</div>
			</m.div>

			<div className="mt-12 grid gap-4 lg:grid-cols-12">
				<CareerTimelineCard />
				<WebMcpConnectionsCard />
				<ResumeMatchingCard />
			</div>
		</div>
	);
}
