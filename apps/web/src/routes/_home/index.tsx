import { createFileRoute } from "@tanstack/react-router";
import { createRootStructuredDataScript, getCanonicalRootUrl } from "@/libs/seo";
import { Faq } from "./-sections/faq";
import { Features } from "./-sections/features";
import { Footer } from "./-sections/footer";
import { Hero } from "./-sections/hero";
import { Prefooter } from "./-sections/prefooter";
import { Statistics } from "./-sections/statistics";

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
					href: "/images/landing/career-collage-hero-v2.webp",
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
		<main id="main-content" className="relative bg-[#f7f3e9] font-landing text-[#121516]">
			<Hero />

			<div className="container mx-auto px-4 sm:px-6 lg:px-12">
				<div className="border-[#c9c0ae] border-x [&>section:first-child]:border-t-0 [&>section]:border-[#c9c0ae] [&>section]:border-t">
					<Statistics />
					<Features />
					<Faq />
					<Prefooter />
					<Footer />
				</div>
			</div>
		</main>
	);
}
