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
			className="group relative min-h-44 overflow-hidden rounded-2xl border border-[#e3ded3] bg-white p-5 shadow-[0_12px_34px_rgba(54,47,38,0.05)] transition-all hover:-translate-y-1 hover:border-[#ef5a2f]/30 hover:shadow-[0_18px_45px_rgba(54,47,38,0.09)]"
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.15 }}
			transition={{ duration: 0.45, delay: (index % 2) * 0.08 }}
		>
			<div className="flex items-start justify-between gap-4">
				<span className="grid size-9 place-items-center rounded-xl bg-[#fff0e8]">
					<Icon aria-hidden="true" className="size-4.5 text-[#ef5a2f]" weight="regular" />
				</span>
				<span className="font-mono text-[#aaa7a0] text-[9px] tracking-[0.12em]">
					{String(index + 1).padStart(2, "0")}
				</span>
			</div>

			<div className="mt-7 max-w-md">
				<p className="font-mono text-[#df542c] text-[8px] uppercase tracking-[0.16em]">{code}</p>
				<h3 className="mt-2 font-medium text-lg tracking-[-0.035em]">{title}</h3>
				<p className="mt-2 line-clamp-2 text-[#737570] text-xs leading-5">{description}</p>
			</div>

			<div
				aria-hidden="true"
				className="absolute inset-x-5 bottom-0 h-0.5 origin-left scale-x-0 bg-[#ef5a2f] transition-transform duration-500 group-hover:scale-x-100"
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
		<section id="features" className="bg-[#fbfaf6]">
			<ProductShowcase />

			<m.div
				className="mx-auto max-w-2xl px-6 pt-12 pb-10 text-center md:pt-20"
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.5 }}
			>
				<p className="font-mono text-[#e65328] text-[10px] uppercase tracking-[0.2em]">Everything stays useful</p>
				<div>
					<h2 className="mt-5 text-balance font-medium text-4xl leading-[0.98] tracking-[-0.055em] md:text-5xl">
						<Trans>Remember every career win.</Trans>
					</h2>
					<p className="mt-5 text-[#6b6e6b] text-sm leading-7">
						<Trans>
							Build one living knowledge base from your projects, outcomes, and tools—then turn it into the right story
							when opportunity arrives.
						</Trans>
					</p>
				</div>
			</m.div>

			<div className="mx-auto grid max-w-6xl gap-3 px-5 pb-24 sm:grid-cols-2 sm:px-8 md:pb-32 lg:grid-cols-4">
				{features.map((feature, index) => (
					<FeatureCard key={feature.id} {...feature} index={index} />
				))}
			</div>
		</section>
	);
}
