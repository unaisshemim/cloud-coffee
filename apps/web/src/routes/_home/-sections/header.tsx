import { t } from "@lingui/core/macro";
import { CaretDownIcon, ListIcon, XIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { BrandIcon } from "@reactive-resume/ui/components/brand-icon";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@reactive-resume/ui/components/dropdown-menu";
import { cn } from "@reactive-resume/utils/style";

const careerUseItems = [
	{ title: "Capture every win", description: "Save projects, milestones, hackathons, and measurable outcomes." },
	{ title: "Connect your tools", description: "Bring career evidence into one searchable knowledge base." },
	{ title: "Ask your career", description: "Find the strongest examples and stories from your own work." },
	{ title: "Tailor every resume", description: "Match your evidence to any job description in minutes." },
] as const;

const resourceItems = [
	{
		title: "FAQ",
		description: "Get quick answers about your career knowledge base.",
		href: "#frequently-asked-questions",
	},
	{ title: "Career dashboard", description: "Organize achievements, applications, and resumes.", href: "/dashboard" },
	{ title: "Sign in", description: "Continue building your career base.", href: "/auth/login" },
] as const;

const navLinkClassName =
	"inline-flex items-center gap-1 font-semibold text-[#172333] text-xs transition-colors duration-200 hover:text-[#ff5a0a] focus-visible:text-[#ff5a0a] focus-visible:outline-none";

const menuLinkClassName =
	"-mx-2 block rounded-lg px-2 py-2.5 font-semibold text-[#172333] text-sm transition-colors hover:bg-[#fff0e9]";

const dropdownItemClassName = cn(
	"h-auto cursor-pointer flex-col items-start gap-1 rounded-xl p-3 text-[#172333]",
	"transition-colors duration-150 focus:bg-[#fff0e9] focus:text-[#172333] data-highlighted:bg-[#fff0e9]",
);

export function Header() {
	const [menuOpen, setMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const reduceMotion = useReducedMotion();

	useEffect(() => {
		const updateScrollState = () => setIsScrolled(window.scrollY > 48);
		updateScrollState();
		window.addEventListener("scroll", updateScrollState, { passive: true });
		return () => window.removeEventListener("scroll", updateScrollState);
	}, []);

	useEffect(() => {
		if (!menuOpen) return;

		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setMenuOpen(false);
		};

		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [menuOpen]);

	const closeMenu = () => setMenuOpen(false);

	return (
		<m.header
			animate={{ opacity: 1, y: 0 }}
			className="fixed top-0 left-0 z-50 w-full px-2 pt-2 font-landing"
			initial={reduceMotion ? false : { opacity: 0, y: -18 }}
			transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
		>
			<nav aria-label={t`Main navigation`}>
				<m.div
					data-testid="landing-nav-shell"
					data-scrolled={isScrolled}
					className={cn(
						"mx-auto max-w-[1120px] px-4 transition-[max-width,background-color,border-color,box-shadow] duration-500 sm:px-6",
						isScrolled &&
							"max-w-[900px] rounded-2xl border border-white/70 bg-[#f7f3e9]/82 shadow-[0_16px_50px_rgba(23,35,51,0.11)] backdrop-blur-xl",
					)}
					layout={!reduceMotion}
					transition={{ layout: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
				>
					<div className="relative flex min-h-[60px] flex-wrap items-center justify-between gap-4 lg:gap-0">
						<div className="flex w-full items-center justify-between lg:w-auto">
							<Link
								to="/"
								aria-label={t`cloudcoffee - Go to homepage`}
								className="inline-flex items-center gap-2 text-[#172333] transition-opacity hover:opacity-75"
							>
								<BrandIcon className="size-8" />
								<span className="font-bold text-sm tracking-[-0.02em]">cloudcoffee</span>
							</Link>

							<button
								type="button"
								aria-expanded={menuOpen}
								aria-label={menuOpen ? "Close menu" : "Open menu"}
								className="relative z-20 grid size-10 place-items-center rounded-full text-[#172333] transition-colors hover:bg-white/60 lg:hidden"
								onClick={() => setMenuOpen((current) => !current)}
							>
								<ListIcon
									className={cn("absolute size-5 transition duration-200", menuOpen && "rotate-180 scale-0 opacity-0")}
								/>
								<XIcon
									className={cn(
										"absolute size-5 -rotate-180 scale-0 opacity-0 transition duration-200",
										menuOpen && "rotate-0 scale-100 opacity-100",
									)}
								/>
							</button>
						</div>

						<div className="absolute inset-0 m-auto hidden size-fit lg:block">
							<m.ul
								animate="visible"
								className="flex items-center gap-8"
								initial={reduceMotion ? false : "hidden"}
								variants={{
									hidden: {},
									visible: { transition: { delayChildren: 0.12, staggerChildren: 0.06 } },
								}}
							>
								<m.li variants={{ hidden: { opacity: 0, y: -8 }, visible: { opacity: 1, y: 0 } }}>
									<a className={navLinkClassName} href="#features">
										How it works
									</a>
								</m.li>
								<m.li variants={{ hidden: { opacity: 0, y: -8 }, visible: { opacity: 1, y: 0 } }}>
									<DropdownMenu>
										<DropdownMenuTrigger className={navLinkClassName}>
											Career uses <CaretDownIcon className="size-3.5 opacity-60" />
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="center"
											className="w-[min(92vw,27rem)] rounded-2xl bg-white/96 p-2 backdrop-blur-xl"
										>
											<div className="grid grid-cols-2 gap-1">
												{careerUseItems.map((item) => (
													<DropdownMenuItem
														key={item.title}
														className={dropdownItemClassName}
														render={<a href="#features" />}
													>
														<span className="font-semibold text-sm leading-snug">{item.title}</span>
														<span className="text-slate-500 text-xs leading-relaxed">{item.description}</span>
													</DropdownMenuItem>
												))}
											</div>
										</DropdownMenuContent>
									</DropdownMenu>
								</m.li>
								<m.li variants={{ hidden: { opacity: 0, y: -8 }, visible: { opacity: 1, y: 0 } }}>
									<Link className={navLinkClassName} to="/ats-checker">
										ATS checker
									</Link>
								</m.li>
								<m.li variants={{ hidden: { opacity: 0, y: -8 }, visible: { opacity: 1, y: 0 } }}>
									<DropdownMenu>
										<DropdownMenuTrigger className={navLinkClassName}>
											Resources <CaretDownIcon className="size-3.5 opacity-60" />
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="center"
											className="w-[min(92vw,29rem)] rounded-2xl bg-white/96 p-2 backdrop-blur-xl"
										>
											<div className="grid grid-cols-2 gap-1">
												{resourceItems.map((item) => (
													<DropdownMenuItem
														key={item.href}
														className={dropdownItemClassName}
														render={<a href={item.href} />}
													>
														<span className="font-semibold text-sm leading-snug">{item.title}</span>
														<span className="text-slate-500 text-xs leading-relaxed">{item.description}</span>
													</DropdownMenuItem>
												))}
											</div>
										</DropdownMenuContent>
									</DropdownMenu>
								</m.li>
							</m.ul>
						</div>

						<div className="hidden items-center gap-2.5 lg:flex">
							<Link
								to="/auth/login"
								className="inline-flex h-9 items-center justify-center rounded-lg border border-[#eee9e4] bg-white/86 px-5 font-semibold text-[#172333] text-[11px] shadow-sm transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[#ffb39d]"
							>
								Sign in
							</Link>
							<Link
								to="/dashboard"
								className="group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-lg bg-[#ff5a0a] px-5 font-semibold text-[11px] text-white shadow-[0_8px_20px_rgba(255,90,10,0.24)] transition-transform hover:-translate-y-0.5"
							>
								{!reduceMotion ? (
									<m.span
										aria-hidden="true"
										animate={{ x: ["-180%", "260%"] }}
										className="absolute inset-y-0 w-10 rotate-12 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-sm"
										transition={{
											duration: 2.4,
											ease: "easeInOut",
											repeat: Number.POSITIVE_INFINITY,
											repeatDelay: 1.8,
										}}
									/>
								) : null}
								<span className="relative">Build career base</span>
							</Link>
						</div>

						<AnimatePresence initial={false}>
							{menuOpen ? (
								<m.div
									animate={{ height: "auto", opacity: 1, y: 0 }}
									className="w-full overflow-hidden lg:hidden"
									exit={{ height: 0, opacity: 0, y: -10 }}
									initial={{ height: 0, opacity: 0, y: -10 }}
									transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
								>
									<div className="mb-3 rounded-2xl border border-white/70 bg-[#f7f3e9]/94 p-5 shadow-[0_18px_50px_rgba(23,35,51,0.12)] backdrop-blur-xl">
										<ul className="grid gap-0.5">
											<li>
												<Link className={menuLinkClassName} hash="features" to="/" onClick={closeMenu}>
													How it works
												</Link>
											</li>
											<li>
												<Link className={menuLinkClassName} hash="features" to="/" onClick={closeMenu}>
													Career uses
												</Link>
											</li>
											<li>
												<Link className={menuLinkClassName} to="/ats-checker" onClick={closeMenu}>
													ATS checker
												</Link>
											</li>
											<li>
												<Link
													className={menuLinkClassName}
													hash="frequently-asked-questions"
													to="/"
													onClick={closeMenu}
												>
													FAQ
												</Link>
											</li>
										</ul>
										<div className="mt-5 grid grid-cols-2 gap-2 border-[#ded5c5] border-t pt-5">
											<Link
												to="/auth/login"
												className="inline-flex h-10 items-center justify-center rounded-lg border border-[#ded5c5] bg-white font-semibold text-[#172333] text-xs"
												onClick={closeMenu}
											>
												Sign in
											</Link>
											<Link
												to="/dashboard"
												className="inline-flex h-10 items-center justify-center rounded-lg bg-[#ff5a0a] font-semibold text-white text-xs"
												onClick={closeMenu}
											>
												Build career base
											</Link>
										</div>
									</div>
								</m.div>
							) : null}
						</AnimatePresence>
					</div>
				</m.div>
			</nav>
		</m.header>
	);
}
