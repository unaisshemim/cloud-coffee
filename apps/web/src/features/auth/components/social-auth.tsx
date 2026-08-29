import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { GoogleLogoIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@reactive-resume/ui/components/button";
import { Skeleton } from "@reactive-resume/ui/components/skeleton";
import { toast } from "@reactive-resume/ui/components/toast";
import { authClient } from "@/libs/auth/client";
import { orpc } from "@/libs/orpc/client";

type SocialAuthProps = {
	callbackURL: string;
};

export function SocialAuth({ callbackURL }: SocialAuthProps) {
	const { data: providers = {}, isLoading } = useQuery(orpc.auth.providers.list.queryOptions());

	if (isLoading) return <Skeleton className="h-9 w-full" />;

	if (!("google" in providers)) {
		return (
			<p role="status" className="text-center text-muted-foreground text-sm">
				<Trans>Google sign-in is unavailable. Configure Google OAuth credentials and try again.</Trans>
			</p>
		);
	}

	const signInWithGoogle = async () => {
		const toastId = toast.add({ type: "loading", description: t`Signing in...` });
		const { error } = await authClient.signIn.social({ provider: "google", callbackURL });

		if (error) {
			toast.add({
				type: "error",
				description:
					error.message ||
					t({
						comment: "Fallback toast when Google sign-in fails without an error message",
						message: "Failed to sign in. Please try again.",
					}),
				id: toastId,
			});
			return;
		}

		toast.close(toastId);
	};

	return (
		<Button className="w-full bg-[#4285F4] text-white hover:bg-[#4285F4]/80" onClick={() => void signInWithGoogle()}>
			<GoogleLogoIcon />
			<Trans comment="Google OAuth sign-in button label">Continue with Google</Trans>
		</Button>
	);
}
