import { MonitorIcon } from "@phosphor-icons/react";

export const SMALL_SCREEN_MEDIA_QUERY = "(max-width: 1023px)";

export function SmallScreenNotice() {
	return (
		<main className="flex min-h-svh items-center justify-center bg-[#fbf8f4] px-6 text-[#202033]">
			<div className="w-full max-w-md text-center">
				<div className="mx-auto mb-8 flex size-14 items-center justify-center rounded-md border border-[#dedce3] bg-white">
					<MonitorIcon className="size-7 text-[#6255e7]" />
				</div>
				<p className="mb-3 font-semibold text-[#6255e7] text-sm">Resume Builder | Dashboard - Wobo AI</p>
				<h1 className="font-semibold text-3xl">Screen Size Too Small</h1>
				<p className="mt-4 text-[#747386] leading-7">
					The resume builder requires a larger screen for the best experience. Please use a laptop or desktop to access
					all features.
				</p>
			</div>
		</main>
	);
}
