import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { m } from "motion/react";
import { Button } from "@reactive-resume/ui/components/button";

export function Prefooter() {
	return (
		<section id="prefooter" className="relative overflow-hidden bg-[#e9dfcc] px-6 py-20 md:px-12 md:py-28">
			<m.img
				aria-hidden="true"
				alt=""
				width={1672}
				height={941}
				loading="lazy"
				decoding="async"
				src="/images/landing/career-crystal-cta.webp"
				className="absolute inset-0 size-full object-cover object-[38%_center] opacity-70 mix-blend-multiply md:object-center"
				initial={{ scale: 1.025, opacity: 0.35 }}
				whileInView={{ scale: 1, opacity: 0.65 }}
				viewport={{ once: true, amount: 0.2 }}
				transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
			/>
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-linear-to-r from-[#e9dfcc]/15 via-[#e9dfcc]/74 to-[#e9dfcc]/94"
			/>
			<div aria-hidden="true" className="absolute inset-0 opacity-35">
				<div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49.8%,#b8aa91_50%,transparent_50.2%),linear-gradient(transparent_49.8%,#b8aa91_50%,transparent_50.2%)] bg-[size:72px_72px]" />
			</div>

			<m.div
				className="relative mx-auto max-w-4xl text-center md:ms-auto md:me-0 md:max-w-2xl md:text-start"
				initial={{ opacity: 0, y: 24 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.55 }}
			>
				<p className="font-bold font-mono text-[#5f6c71] text-xs uppercase tracking-[0.2em]">
					opportunity.ready = true
				</p>
				<h2 className="mt-5 font-bold text-4xl leading-[0.96] tracking-[-0.055em] md:text-6xl">
					<Trans>Your career already has the proof.</Trans>
				</h2>
				<p className="mx-auto mt-6 max-w-2xl text-[#4e5557] leading-relaxed md:mx-0 md:text-lg">
					<Trans>
						Connect the work you've already done, keep every result searchable, and shape the right story for the next
						role.
					</Trans>
				</p>

				<Button
					size="lg"
					nativeButton={false}
					className="mt-8 rounded-md bg-[#ff5a0a] px-5 font-bold text-white shadow-[0_5px_0_#bf3f00] hover:-translate-y-0.5 hover:bg-[#f1530a]"
					render={
						<Link to="/dashboard">
							<Trans>Build your career base</Trans>
							<ArrowRightIcon weight="bold" />
						</Link>
					}
				/>
			</m.div>
		</section>
	);
}
