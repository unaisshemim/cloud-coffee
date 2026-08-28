import type { Icon } from "@phosphor-icons/react";
import { t } from "@lingui/core/macro";
import { FileTextIcon, UsersIcon } from "@phosphor-icons/react";
import { useQueries } from "@tanstack/react-query";
import { m } from "motion/react";
import { CountUp } from "@/components/animation/count-up";
import { orpc } from "@/libs/orpc/client";

type Statistic = {
	id: string;
	label: string;
	value: number;
	icon: Icon;
};

const getStatistics = (userCount: number, resumeCount: number): Statistic[] => [
	{
		id: "users",
		label: t`Career builders`,
		value: userCount,
		icon: UsersIcon,
	},
	{
		id: "resumes",
		label: t`Resumes created`,
		value: resumeCount,
		icon: FileTextIcon,
	},
];

type StatisticCardProps = {
	statistic: Statistic;
	index: number;
};

function StatisticCard({ statistic, index }: StatisticCardProps) {
	const Icon = statistic.icon;

	return (
		<m.div
			className="group relative min-h-72 overflow-hidden border-[#c9c0ae] border-b p-8 last:border-e-0 sm:border-r sm:border-b-0 sm:last:border-r-0 md:p-12"
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-50px" }}
			transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
		>
			<div className="flex items-center justify-between">
				<p className="font-mono text-[#687176] text-xs uppercase tracking-[0.18em]">live.signal</p>
				<Icon aria-hidden="true" className="size-7 text-[#f1530a]" weight="thin" />
			</div>

			{/* Value */}
			<CountUp
				key={statistic.id}
				separator=","
				duration={0.8}
				to={statistic.value}
				className="mt-12 block font-bold text-6xl tracking-[-0.06em] md:text-8xl"
			/>

			{/* Label */}
			<p className="mt-2 font-bold text-[#555c5f] text-sm uppercase tracking-[0.12em]">{statistic.label}</p>
			<div
				aria-hidden="true"
				className="absolute inset-x-0 bottom-0 h-1 bg-[#f1530a] opacity-0 transition-opacity group-hover:opacity-100"
			/>
		</m.div>
	);
}

export function Statistics() {
	const [userCountResult, resumeCountResult] = useQueries({
		queries: [orpc.statistics.user.getCount.queryOptions(), orpc.statistics.resume.getCount.queryOptions()],
	});

	if (!userCountResult.data || !resumeCountResult.data) return null;

	return (
		<section id="statistics" aria-labelledby="stats-heading" className="bg-[#efe6d6]">
			<h2 id="stats-heading" className="sr-only">
				{t`Application Statistics`}
			</h2>

			<div className="grid grid-cols-1 sm:grid-cols-2">
				{getStatistics(userCountResult.data, resumeCountResult.data).map((statistic, index) => (
					<StatisticCard key={statistic.id} statistic={statistic} index={index} />
				))}
			</div>
		</section>
	);
}
