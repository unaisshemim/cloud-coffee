import type { AuthSession } from "@reactive-resume/auth/types";
import type { ApplicationProfile } from "@reactive-resume/schema/application-profile";
import type { ProfileSectionId, ProfileWorkspaceProps } from "./types";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { defaultApplicationProfile } from "@reactive-resume/schema/application-profile";
import { Button } from "@reactive-resume/ui/components/button";
import { toast } from "@reactive-resume/ui/components/toast";
import { getReadableErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { ProfileNavigation } from "./navigation";
import { ProfileSections } from "./sections";

const lightWorkspaceStyle = {
	"--accent": "oklch(0.97 0 0)",
	"--accent-foreground": "oklch(0.205 0 0)",
	"--background": "oklch(1 0 0)",
	"--border": "oklch(0.922 0 0)",
	"--foreground": "oklch(0.145 0 0)",
	"--input": "oklch(0.922 0 0)",
	"--muted": "oklch(0.97 0 0)",
	"--muted-foreground": "oklch(0.556 0 0)",
	"--primary": "oklch(0.55 0.24 282)",
	"--primary-foreground": "oklch(0.985 0 0)",
	colorScheme: "light",
} as React.CSSProperties;

export function ProfileWorkspace({ profile, resumes, onChange, onSave, isSaving }: ProfileWorkspaceProps) {
	const [active, setActive] = useState<ProfileSectionId>("job-preferences");

	return (
		<div
			style={lightWorkspaceStyle}
			className="relative grid min-h-[760px] overflow-hidden rounded-lg border bg-white text-foreground shadow-sm xl:grid-cols-[300px_minmax(0,1fr)]"
		>
			<ProfileNavigation active={active} onSelect={setActive} profile={profile} resumeCount={resumes.length} />
			<div className="relative min-w-0">
				<Button type="button" className="absolute top-6 right-7 z-10" onClick={onSave} disabled={isSaving}>
					{isSaving ? (
						<span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
					) : (
						<FloppyDiskIcon />
					)}
					<Trans>Save Changes</Trans>
				</Button>
				<ProfileSections active={active} profile={profile} resumes={resumes} onChange={onChange} />
			</div>
		</div>
	);
}

function hydratePersonal(profile: ApplicationProfile, session: AuthSession): ApplicationProfile {
	if (profile.personal.firstName || profile.personal.lastName || profile.personal.email) return profile;
	const parts = session.user.name.trim().split(/\s+/);
	return {
		...profile,
		personal: {
			...profile.personal,
			firstName: parts[0] ?? "",
			lastName: parts.slice(1).join(" "),
			email: session.user.email,
		},
	};
}

type ApplicationProfileSettingsPageProps = {
	session: AuthSession;
};

export function ApplicationProfileSettingsPage({ session }: ApplicationProfileSettingsPageProps) {
	const { data, isLoading } = useQuery(orpc.applicationProfile.get.queryOptions());
	const { data: resumes = [] } = useQuery(orpc.resume.list.queryOptions());
	const [profile, setProfile] = useState<ApplicationProfile>(() => hydratePersonal(defaultApplicationProfile, session));
	const [revision, setRevision] = useState(0);

	useEffect(() => {
		if (data) {
			setProfile(hydratePersonal(data.profile, session));
			setRevision(data.revision);
		}
	}, [data, session]);

	const { mutate: save, isPending } = useMutation(
		orpc.applicationProfile.update.mutationOptions({
			onSuccess: (saved) => {
				setProfile(saved.profile);
				setRevision(saved.revision);
				toast.add({ type: "success", description: t`Your application profile has been saved.` });
			},
			onError: (error) => {
				toast.add({
					type: "error",
					description: getReadableErrorMessage(error, t`Failed to save your application profile. Please try again.`),
				});
			},
		}),
	);

	if (isLoading) {
		return (
			<div className="grid min-h-[560px] place-items-center rounded-lg border bg-white">
				<div className="grid justify-items-center gap-3 text-muted-foreground">
					<span className="size-7 animate-spin rounded-full border-2 border-violet-600 border-r-transparent" />
					<Trans>Loading profile...</Trans>
				</div>
			</div>
		);
	}

	return (
		<ProfileWorkspace
			profile={profile}
			resumes={resumes}
			onChange={setProfile}
			onSave={() => save({ profile, revision })}
			isSaving={isPending}
		/>
	);
}
