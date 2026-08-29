import type { AuthSession } from "@reactive-resume/auth/types";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useStore } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { AnimatePresence, m } from "motion/react";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { toast } from "@reactive-resume/ui/components/toast";
import { authClient } from "@/libs/auth/client";
import { getReadableErrorMessage } from "@/libs/error-message";
import { useAppForm } from "@/libs/tanstack-form";

const formSchema = z.object({
	name: z.string().trim().min(1).max(64),
	username: z
		.string()
		.trim()
		.min(1)
		.max(64)
		.regex(/^[a-z0-9._-]+$/, {
			message: "Username can only contain lowercase letters, numbers, dots, hyphens and underscores.",
		}),
});

type Props = {
	session: AuthSession;
};

export function AccountIdentityForm({ session }: Props) {
	const router = useRouter();

	const form = useAppForm({
		defaultValues: {
			name: session.user.name,
			username: session.user.username,
		},
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const { error } = await authClient.updateUser({
				name: value.name,
				username: value.username,
				displayUsername: value.username,
			});

			if (error) {
				toast.add({
					type: "error",
					description: getReadableErrorMessage(
						error,
						t({
							comment: "Fallback toast when updating profile details fails",
							message: "Failed to update your profile. Please try again.",
						}),
					),
				});
				return;
			}

			toast.add({ type: "success", description: t`Your profile has been updated successfully.` });
			form.reset({ name: value.name, username: value.username });
			void router.invalidate();
		},
	});

	const onCancel = () => {
		form.reset();
	};

	const isDirty = useStore(form.store, (s) => s.isDirty);

	return (
		<m.form
			initial={{ y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: "easeOut" }}
			className="grid max-w-xl gap-6 will-change-[transform,opacity]"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.Field name="name">
				{(field) => (
					<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
						<FormLabel>
							<Trans>Name</Trans>
						</FormLabel>
						<FormControl
							render={
								<Input
									min={3}
									max={64}
									autoComplete="name"
									placeholder={t({
										comment: "Example full name placeholder on profile settings form",
										message: "John Doe",
									})}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
							}
						/>
						<FormMessage errors={field.state.meta.errors} />
					</FormItem>
				)}
			</form.Field>

			<form.Field name="username">
				{(field) => (
					<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
						<FormLabel>
							<Trans>Username</Trans>
						</FormLabel>
						<FormControl
							render={
								<Input
									min={3}
									max={64}
									autoComplete="username"
									placeholder={t({
										comment: "Example username placeholder on profile settings form",
										message: "john.doe",
									})}
									className="lowercase"
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
							}
						/>
						<FormMessage errors={field.state.meta.errors} />
					</FormItem>
				)}
			</form.Field>

			<FormItem>
				<FormLabel htmlFor="email">
					<Trans>Email Address</Trans>
				</FormLabel>
				<FormControl
					render={<Input id="email" type="email" className="lowercase" value={session.user.email} disabled readOnly />}
				/>
				<p className="text-muted-foreground text-xs">
					<Trans>Email address is managed by Google.</Trans>
				</p>
			</FormItem>

			<AnimatePresence initial={false} mode="popLayout">
				{isDirty && (
					<m.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.16, ease: "easeOut" }}
						className="flex items-center gap-x-4 justify-self-end will-change-[transform,opacity]"
					>
						<Button type="reset" variant="ghost" onClick={onCancel}>
							<Trans comment="Profile settings form action to discard unsaved edits">Cancel</Trans>
						</Button>

						<Button type="submit">
							<Trans>Save Changes</Trans>
						</Button>
					</m.div>
				)}
			</AnimatePresence>
		</m.form>
	);
}
