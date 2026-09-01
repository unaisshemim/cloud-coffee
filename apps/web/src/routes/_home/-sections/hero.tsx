import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { m } from "motion/react";
import { Button } from "@reactive-resume/ui/components/button";

type AsciiDrift = {
	id: string;
	text: string;
	className: string;
	duration: number;
	delay: number;
};

const asciiDrifts: AsciiDrift[] = [
	{
		id: "connections",
		text: "< WEBMCP.CONNECTED >\n12 sources\nsync: true",
		className: "end-[6%] top-[58%] text-end",
		duration: 8.5,
		delay: 1.2,
	},
	{
		id: "resume",
		text: "resume.fit(92%)\nrole: product\nready: yes",
		className: "start-[7%] top-[25%]",
		duration: 7.8,
		delay: 2.1,
	},
];

export function Hero() {
	return (
		<section id="hero" className="relative min-h-[46rem] w-full overflow-hidden bg-[#f8f4e9] sm:min-h-[50rem]">
			<div className="absolute inset-0 mt-19 overflow-hidden">
				<m.img
					alt={t`An editorial career collage with a data crystal and a flying laptop`}
					width={1672}
					height={941}
					fetchPriority="high"
					decoding="async"
					src="/images/landing/career-hero-collage.webp"
					className="size-full object-fit object-top sm:object-center sm:object-fit"
				/>
			</div>

			<div
				aria-hidden="true"
				className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,247,239,0.72)_0%,rgba(250,247,239,0.24)_44%,transparent_68%),linear-gradient(180deg,rgba(247,243,233,0.45)_0%,transparent_22%,transparent_78%,rgba(247,243,233,0.68)_100%)]"
			/>

			{asciiDrifts.map((drift) => (
				<m.pre
					key={drift.id}
					aria-hidden="true"
					data-testid="career-ascii"
					className={`pointer-events-none absolute z-10 hidden whitespace-pre-wrap font-mono text-[#53656f]/36 text-[9px] uppercase leading-relaxed tracking-[0.14em] mix-blend-multiply lg:block ${drift.className}`}
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: [0.22, 0.62, 0.22], y: [8, -7, 8] }}
					transition={{
						duration: drift.duration,
						delay: drift.delay,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				>
					{drift.text}
				</m.pre>
			))}

			<div className="container relative z-20 mx-auto flex min-h-[46rem] items-center justify-center px-6 pt-28 pb-20 sm:min-h-[50rem] lg:px-12">
				<div className="flex max-w-4xl flex-col items-center text-center font-landing text-[#151716]">
					<m.p
						className="font-medium text-[#647074] text-[10px] uppercase tracking-[0.24em] sm:text-[11px]"
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55, delay: 0.12 }}
					>
						<Trans>Your career knowledge base</Trans>
					</m.p>

					<m.h1
						className="mt-5 max-w-4xl text-balance font-medium text-[2.8rem] leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-[5rem]"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.24 }}
					>
						<Trans>Career intelligence at the</Trans>{" "}
						<span className="font-normal font-serif text-[#ee5a24] italic tracking-[-0.04em]">
							<Trans>speed of opportunity.</Trans>
						</span>
					</m.h1>

					<m.p
						className="mt-6 max-w-xl text-[#535b5d] text-[15px] leading-7 sm:text-base"
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.65, delay: 0.38 }}
					>
						<Trans>
							One knowledge base for every project, launch, and win. Connect your tools, ask anything, and tailor the
							right resume for any role.
						</Trans>
					</m.p>

					<m.div
						className="mt-8 flex flex-col items-center gap-4 sm:flex-row"
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.65, delay: 0.5 }}
					>
						<Button
							size="lg"
							nativeButton={false}
							className="group h-11 rounded-full bg-[#ef5a2f] px-6 font-medium text-white shadow-[0_10px_28px_rgba(239,90,47,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#df4c25]"
							render={
								<Link to="/dashboard">
									<Trans>Build your career base</Trans>
									<ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" weight="bold" />
								</Link>
							}
						/>

						<a
							href="#features"
							className="border-[#313638]/45 border-b pb-1 font-bold text-[#313638] text-sm transition-colors hover:border-[#f1530a] hover:text-[#f1530a]"
						>
							<Trans>See how it works</Trans>
						</a>
					</m.div>
				</div>
			</div>
		</section>
	);
}
