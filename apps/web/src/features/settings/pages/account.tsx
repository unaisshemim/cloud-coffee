import type { AuthSession } from "@reactive-resume/auth/types";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { DownloadSimpleIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { m } from "motion/react";
import { useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { Input } from "@reactive-resume/ui/components/input";
import { Label } from "@reactive-resume/ui/components/label";
import { toast } from "@reactive-resume/ui/components/toast";
import { downloadWithAnchor, generateFilename } from "@reactive-resume/utils/file";
import { LocaleCombobox } from "@/features/locale/combobox";
import { IntegrationsSettingsPage } from "@/features/settings/integrations";
import { ThemeCombobox } from "@/features/theme/combobox";
import { useConfirm } from "@/hooks/use-confirm";
import { authClient } from "@/libs/auth/client";
import { getReadableErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { AccountIdentityForm } from "./profile";

const CONFIRMATION_TEXT = "delete";

type AccountSettingsPageProps = {
	session: AuthSession;
};

type AccountSectionProps = {
	title: React.ReactNode;
	description: React.ReactNode;
	children: React.ReactNode;
};

function AccountSection({ title, description, children }: AccountSectionProps) {
	return (
		<section className="grid gap-5 border-border border-b pb-8 last:border-0 last:pb-0">
			<header className="grid gap-1">
				<h2 className="font-semibold text-lg">{title}</h2>
				<p className="text-muted-foreground text-sm">{description}</p>
			</header>
			{children}
		</section>
	);
}

export function AccountSettingsPage({ session }: AccountSettingsPageProps) {
	const confirm = useConfirm();
	const navigate = useNavigate();
	const [confirmationText, setConfirmationText] = useState("");
	const isConfirmationValid = confirmationText === CONFIRMATION_TEXT;

	const { mutate: deleteAccount } = useMutation(orpc.auth.deleteAccount.mutationOptions());

	const { mutate: exportData, isPending: isExporting } = useMutation(
		orpc.auth.exportData.mutationOptions({
			onSuccess: (data) => {
				const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
				downloadWithAnchor(blob, generateFilename("reactive-resume-export", "json"));
				toast.add({ type: "success", description: t`Your data has been exported successfully.` });
			},
			onError: (error) => {
				toast.add({
					type: "error",
					description: getReadableErrorMessage(
						error,
						t({
							comment: "Fallback toast when data export fails",
							message: "Failed to export your data. Please try again.",
						}),
					),
				});
			},
		}),
	);

	const handleDeleteAccount = async () => {
		const confirmed = await confirm(t`Are you sure you want to delete your account?`, {
			description: t`This action cannot be undone. All your data will be permanently deleted.`,
			confirmText: t({
				comment: "Account deletion confirmation dialog confirm action in account settings",
				message: "Confirm",
			}),
			cancelText: t({
				comment: "Account deletion confirmation dialog cancel action in account settings",
				message: "Cancel",
			}),
		});

		if (!confirmed) return;

		const toastId = toast.add({ type: "loading", description: t`Deleting your account...` });

		deleteAccount(undefined, {
			onSuccess: async () => {
				toast.add({ type: "success", description: t`Your account has been deleted successfully.`, id: toastId });
				await authClient.signOut();
				void navigate({ to: "/" });
			},
			onError: (error) => {
				toast.add({
					type: "error",
					description: getReadableErrorMessage(
						error,
						t({
							comment: "Fallback toast when account deletion fails",
							message: "Failed to delete your account. Please try again.",
						}),
					),
					id: toastId,
				});
			},
		});
	};

	return (
		<m.div
			initial={{ y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: "easeOut" }}
			className="grid max-w-4xl gap-8 will-change-[transform,opacity]"
		>
			<AccountSection
				title={<Trans>Personal details</Trans>}
				description={<Trans>Manage the identity and email used by your cloudcoffee account.</Trans>}
			>
				<AccountIdentityForm session={session} />
			</AccountSection>

			<AccountSection
				title={<Trans>Appearance & language</Trans>}
				description={<Trans>Choose how cloudcoffee looks and which language it uses.</Trans>}
			>
				<div className="grid max-w-xl gap-5 sm:grid-cols-2">
					<div className="grid gap-1.5">
						<Label>
							<Trans>Theme</Trans>
						</Label>
						<ThemeCombobox />
					</div>
					<div className="grid gap-1.5">
						<Label>
							<Trans>Language</Trans>
						</Label>
						<LocaleCombobox />
					</div>
				</div>
			</AccountSection>

			<AccountSection
				title={<Trans>AI providers</Trans>}
				description={<Trans>Configure provider credentials used by resume imports and AI review.</Trans>}
			>
				<IntegrationsSettingsPage />
			</AccountSection>

			<AccountSection
				title={<Trans>Data & account</Trans>}
				description={<Trans>Export your data or permanently remove your account.</Trans>}
			>
				<div className="grid max-w-xl gap-6">
					<div className="grid gap-3">
						<p className="leading-relaxed">
							<Trans>Download a copy of all your data, including your profile and every resume, as a JSON file.</Trans>
						</p>

						<m.div
							className="justify-self-start will-change-transform"
							whileHover={{ y: -1, scale: 1.01 }}
							whileTap={{ scale: 0.98 }}
							transition={{ duration: 0.14, ease: "easeOut" }}
						>
							<Button variant="outline" onClick={() => exportData(undefined)} disabled={isExporting}>
								<DownloadSimpleIcon />
								<Trans>Export my data</Trans>
							</Button>
						</m.div>
					</div>

					<hr className="border-border" />

					<p className="leading-relaxed">
						<Trans>To delete your account, you need to enter the confirmation text and click the button below.</Trans>
					</p>

					<Input
						type="text"
						value={confirmationText}
						onChange={(e) => setConfirmationText(e.target.value)}
						placeholder={t`Type "${CONFIRMATION_TEXT}" to confirm`}
					/>

					<m.div
						className="justify-self-end will-change-transform"
						whileHover={!isConfirmationValid ? undefined : { y: -1, scale: 1.01 }}
						whileTap={!isConfirmationValid ? undefined : { scale: 0.98 }}
						transition={{ duration: 0.14, ease: "easeOut" }}
					>
						<Button variant="destructive" onClick={handleDeleteAccount} disabled={!isConfirmationValid}>
							<TrashSimpleIcon />
							<Trans>Delete Account</Trans>
						</Button>
					</m.div>
				</div>
			</AccountSection>
		</m.div>
	);
}
