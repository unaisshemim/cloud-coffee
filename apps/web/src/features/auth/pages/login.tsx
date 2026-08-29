import { Trans } from "@lingui/react/macro";
import { SocialAuth } from "../components/social-auth";

type LoginPageProps = {
	callbackURL: string;
};

export function LoginPage({ callbackURL }: LoginPageProps) {
	return (
		<>
			<div className="space-y-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					<Trans comment="Title on the login page">Sign in to your account</Trans>
				</h1>
				<p className="text-muted-foreground">
					<Trans>Continue with Google to access your account.</Trans>
				</p>
			</div>

			<SocialAuth callbackURL={callbackURL} />
		</>
	);
}
