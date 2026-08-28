import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { m } from "motion/react";
import { BrandIcon } from "@reactive-resume/ui/components/brand-icon";

type FooterLinkItem = {
	url: string;
	label: string;
};

type FooterLinkGroupProps = {
	title: string;
	links: FooterLinkItem[];
};

const getCareerLinks = (): FooterLinkItem[] => [
	{ url: "#hero", label: t`Career base` },
	{ url: "#features", label: t`How it works` },
	{ url: "#frequently-asked-questions", label: t`Questions` },
];

const getProductLinks = (): FooterLinkItem[] => [
	{ url: "/dashboard", label: t`Dashboard` },
	{ url: "/ats-checker", label: t`ATS checker` },
	{ url: "/auth/login", label: t`Sign in` },
];

export function Footer() {
	return (
		<m.footer
			id="footer"
			className="bg-[#121516] p-6 text-[#f7f3e9] md:p-10"
			initial={{ opacity: 0 }}
			whileInView={{ opacity: 1 }}
			viewport={{ once: true }}
			transition={{ duration: 0.45 }}
		>
			<div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
				<div className="max-w-sm space-y-5">
					<BrandIcon variant="logo" className="size-10 brightness-0 invert" />
					<div>
						<h2 className="font-bold text-2xl tracking-[-0.04em]">cloudcoffee</h2>
						<p className="mt-3 text-[#d7d0c2] text-sm leading-relaxed">
							<Trans>Your career knowledge base—ready whenever opportunity appears.</Trans>
						</p>
					</div>
				</div>

				<FooterLinkGroup title={t`Career base`} links={getCareerLinks()} />
				<FooterLinkGroup title={t`Product`} links={getProductLinks()} />
			</div>

			<div className="mt-12 flex flex-col gap-3 border-[#4b4d49] border-t pt-5 text-[#aaa99f] text-xs sm:flex-row sm:items-center sm:justify-between">
				<p className="font-mono uppercase tracking-[0.16em]">memory.sync: ready</p>
				<p>
					<Trans>
						cloudcoffee v<bdi>{__APP_VERSION__}</bdi>
					</Trans>
				</p>
			</div>
		</m.footer>
	);
}

function FooterLinkGroup({ title, links }: FooterLinkGroupProps) {
	return (
		<div>
			<h2 className="font-bold text-[#f1530a] text-xs uppercase tracking-[0.18em]">{title}</h2>
			<ul className="mt-5 space-y-3">
				{links.map((link) => (
					<li key={link.url}>
						<a className="text-[#d7d0c2] text-sm transition-colors hover:text-white" href={link.url}>
							{link.label}
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}
