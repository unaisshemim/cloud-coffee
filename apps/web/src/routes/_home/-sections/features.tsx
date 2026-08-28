import type { Icon } from "@phosphor-icons/react";
import type { LinkProps } from "@tanstack/react-router";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	ArchiveBoxIcon,
	ChatCircleDotsIcon,
	FileTextIcon,
	MagnifyingGlassIcon,
	PlugsConnectedIcon,
	ShieldCheckIcon,
	SparkleIcon,
	TargetIcon,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { m } from "motion/react";
import { ProductShowcase } from "./product-showcase";

type Feature = {
	id: string;
	icon: Icon;
	title: string;
	description: string;
	code: string;
	to?: LinkProps["to"];
};

type FeatureCardProps = Feature & {
	index: number;
};

const getFeatures = (): Feature[] => [
	{
		id: "capture",
		icon: ArchiveBoxIcon,
		title: t`Capture every win`,
		description: t`Save projects, launches, hackathons, metrics, feedback, and hard-earned lessons while they are still fresh.`,
		code: "MEMORY.ADD",
	},
	{
		id: "connect",
		icon: PlugsConnectedIcon,
		title: t`Connect your tools`,
		description: t`Bring career evidence together from the products and services where your work already lives.`,
		code: "WEBMCP.CONNECT",
	},
	{
		id: "ask",
		icon: ChatCircleDotsIcon,
		title: t`Ask your career`,
		description: t`Find the strongest example, result, or story without digging through old documents and scattered notes.`,
		code: "MEMORY.QUERY",
	},
	{
		id: "tailor",
		icon: TargetIcon,
		title: t`Tailor to any role`,
		description: t`Give cloudcoffee a job description and build a focused resume around the evidence that matters most.`,
		code: "RESUME.FIT",
	},
	{
		id: "evidence",
		icon: MagnifyingGlassIcon,
		title: t`Keep proof attached`,
		description: t`Connect claims to outcomes, artifacts, and context so every resume bullet stays specific and credible.`,
		code: "PROOF.LINK",
	},
	{
		id: "draft",
		icon: SparkleIcon,
		title: t`Turn memory into language`,
		description: t`Shape raw career history into concise bullets, project summaries, and interview-ready stories.`,
		code: "STORY.SHAPE",
	},
	{
		id: "export",
		icon: FileTextIcon,
		title: t`Ship a polished resume`,
		description: t`Refine, format, and export a professional resume without rebuilding your history from scratch.`,
		code: "RESUME.SHIP",
	},
	{
		id: "ats",
		icon: ShieldCheckIcon,
		title: t`Check ATS readability`,
		description: t`See what an applicant tracking system can read before your resume reaches a recruiter.`,
		code: "ATS.CHECK",
		to: "/ats-checker",
	},
];

function FeatureCard({ icon: Icon, title, description, code, to, index }: FeatureCardProps) {
	const card = (
		<m.article
			className="group relative min-h-64 overflow-hidden border-[#c9c0ae] border-b bg-[#f7f3e9] p-6 transition-colors hover:bg-[#efe6d6] sm:p-8 odd:md:border-r"
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.15 }}
			transition={{ duration: 0.45, delay: (index % 2) * 0.08 }}
		>
			<div className="flex items-start justify-between gap-4">
				<span className="font-mono text-[#7d807b] text-xs tracking-[0.12em]">{String(index + 1).padStart(2, "0")}</span>
				<Icon aria-hidden="true" className="size-7 text-[#f1530a]" weight="thin" />
			</div>

			<div className="mt-12 max-w-md">
				<p className="font-bold font-mono text-[#687176] text-[10px] uppercase tracking-[0.18em]">{code}</p>
				<h3 className="mt-3 font-bold text-2xl tracking-[-0.035em]">{title}</h3>
				<p className="mt-3 text-[#555c5f] text-sm leading-relaxed">{description}</p>
			</div>

			<div
				aria-hidden="true"
				className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-[#f1530a] transition-transform duration-500 group-hover:scale-x-100"
			/>
		</m.article>
	);

	if (!to) return card;

	return (
		<Link to={to} className="contents">
			{card}
		</Link>
	);
}

export function Features() {
	const features = getFeatures();

	return (
		<section id="features" className="bg-[#f7f3e9]">
			<ProductShowcase />

			<m.div
				className="grid gap-8 px-6 py-16 md:grid-cols-[0.8fr_1.2fr] md:px-10 md:py-24"
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.5 }}
			>
				<p className="font-bold font-mono text-[#5f6c71] text-xs uppercase tracking-[0.2em]">02 / Career memory</p>
				<div>
					<h2 className="max-w-3xl font-bold text-4xl leading-[0.98] tracking-[-0.055em] md:text-6xl">
						<Trans>Remember every career win.</Trans>
					</h2>
					<p className="mt-6 max-w-2xl text-[#555c5f] leading-relaxed md:text-lg">
						<Trans>
							Build one living knowledge base from your projects, outcomes, and tools—then turn it into the right story
							when opportunity arrives.
						</Trans>
					</p>
				</div>
			</m.div>

			<div className="grid border-[#c9c0ae] border-t md:grid-cols-2">
				{features.map((feature, index) => (
					<FeatureCard key={feature.id} {...feature} index={index} />
				))}
			</div>
		</section>
	);
}
