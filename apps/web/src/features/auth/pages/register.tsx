import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useToggle } from "usehooks-ts";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { toast } from "@reactive-resume/ui/components/toast";
import { authClient } from "@/libs/auth/client";
import { useAppForm } from "@/libs/tanstack-form";
import { SocialAuth } from "../components/social-auth";

const formSchema = z.object({
	name: z.string().trim().min(3).max(64),
	username: z
		.string()
		.trim()
		.toLowerCase()
		.min(3)
		.max(64)
		.regex(/^[a-z0-9._-]+$/, "Use only lowercase letters, numbers, dots, hyphens, and underscores."),
	email: z.email().trim().toLowerCase(),
	password: z.string().min(8).max(64),
});

export function RegisterPage() {
	const router = useRouter();
	const navigate = useNavigate();
	const [showPassword, toggleShowPassword] = useToggle(false);

	const form = useAppForm({
		defaultValues: { name: "", username: "", email: "", password: "" },
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const toastId = toast.add({ type: "loading", description: t`Creating your account...` });

			try {
				const { error } = await authClient.signUp.email({
					name: value.name,
					username: value.username,
					displayUsername: value.username,
					email: value.email,
					password: value.password,
					callbackURL: "/dashboard",
				});

				if (error) {
					toast.add({
						type: "error",
						description: error.message || t`Failed to create your account. Please try again.`,
						id: toastId,
					});
					return;
				}

				toast.close(toastId);
				await router.invalidate();
				void navigate({ to: "/dashboard", replace: true });
			} catch {
				toast.add({ type: "error", description: t`Failed to create your account. Please try again.`, id: toastId });
			}
		},
	});

	return (
		<>
			<div className="space-y-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					<Trans>Create a new account</Trans>
				</h1>
				<div className="text-muted-foreground">
					<Trans>
						Already have an account?{" "}
						<Button
							variant="link"
							nativeButton={false}
							className="h-auto gap-1.5 px-1! py-0"
							render={
								<Link to="/auth/login">
									<Trans>Sign in now</Trans> <ArrowRightIcon />
								</Link>
							}
						/>
					</Trans>
				</div>
			</div>

			<form
				className="space-y-4"
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
										autoComplete="section-register name"
										placeholder="Coffee User"
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
										autoComplete="section-register username"
										placeholder="coffee.user"
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

				<form.Field name="email">
					{(field) => (
						<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
							<FormLabel>
								<Trans>Email Address</Trans>
							</FormLabel>
							<FormControl
								render={
									<Input
										type="email"
										autoComplete="section-register email"
										placeholder="you@example.com"
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

				<form.Field name="password">
					{(field) => (
						<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
							<FormLabel>
								<Trans>Password</Trans>
							</FormLabel>
							<div className="flex items-center gap-1.5">
								<FormControl
									render={
										<Input
											type={showPassword ? "text" : "password"}
											autoComplete="section-register new-password"
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									}
								/>
								<Button
									type="button"
									size="icon"
									variant="ghost"
									onClick={toggleShowPassword}
									aria-label={showPassword ? t`Hide password` : t`Show password`}
								>
									{showPassword ? <EyeSlashIcon /> : <EyeIcon />}
								</Button>
							</div>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>

				<Button type="submit" className="w-full">
					<Trans>Sign up</Trans>
				</Button>
			</form>

			<div className="relative flex items-center justify-center text-muted-foreground text-xs uppercase">
				<span className="absolute inset-x-0 border-t" />
				<span className="relative bg-background px-3">
					<Trans>or</Trans>
				</span>
			</div>

			<SocialAuth callbackURL="/dashboard" />
		</>
	);
}
