import { createFileRoute } from "@tanstack/react-router";
import { createRootStructuredDataScript, getCanonicalRootUrl } from "@/libs/seo";
import { Faq } from "./-sections/faq";
import { Features } from "./-sections/features";
import { Footer } from "./-sections/footer";
import { Hero } from "./-sections/hero";
import { Prefooter } from "./-sections/prefooter";

export const Route = createFileRoute("/_home/")({
	component: RouteComponent,
	head: () => {
		const appUrl = typeof window !== "undefined" ? window.location.origin : "https://rxresu.me";
		const canonicalUrl = getCanonicalRootUrl(appUrl);

		return {
			links: [
				{ rel: "canonical", href: canonicalUrl },
				{
					rel: "preload",
					href: "/images/landing/career-hero-collage.webp",
					as: "image",
					fetchPriority: "high",
				},
			],
			scripts: [createRootStructuredDataScript(canonicalUrl)],
		};
	},
});

function RouteComponent() {
	return (
		<main id="main-content" className="relative bg-[#fbfaf6] font-landing text-[#171918]">
			<Hero />
			<Features />
			<div className="mx-auto max-w-6xl px-5 sm:px-8">
				<Faq />
				<Prefooter />
			</div>
			<Footer />
		</main>
	);
}
