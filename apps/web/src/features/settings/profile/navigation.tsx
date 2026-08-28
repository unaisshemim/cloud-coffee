import type { ApplicationProfile } from "@reactive-resume/schema/application-profile";
import type { ProfileSectionId } from "./types";
import {
	BriefcaseIcon,
	CertificateIcon,
	FileTextIcon,
	FolderSimpleIcon,
	GraduationCapIcon,
	IdentificationCardIcon,
	ScalesIcon,
	ShieldCheckIcon,
	SlidersHorizontalIcon,
	UserIcon,
	WrenchIcon,
} from "@phosphor-icons/react";
import { cn } from "@reactive-resume/utils/style";

type NavigationItem = {
	id: ProfileSectionId;
	label: string;
	description: (profile: ApplicationProfile, resumeCount: number) => string;
	icon: React.ComponentType<{ className?: string }>;
};

const aboutItems: NavigationItem[] = [
	{
		id: "personal",
		label: "Personal info",
		icon: UserIcon,
		description: (p) => [p.personal.firstName, p.personal.city].filter(Boolean).join(" · ") || "Add your details",
	},
	{
		id: "documents",
		label: "Documents",
		icon: FileTextIcon,
		description: (_p, count) => `${count} ${count === 1 ? "resume" : "resumes"}`,
	},
	{
		id: "skills",
		label: "Skills & Languages",
		icon: WrenchIcon,
		description: (p) => `${p.skills.length + p.languages.length} entries`,
	},
	{
		id: "experience",
		label: "Work Experience",
		icon: BriefcaseIcon,
		description: (p) => `${p.experience.length} ${p.experience.length === 1 ? "role" : "roles"}`,
	},
	{
		id: "education",
		label: "Education",
		icon: GraduationCapIcon,
		description: (p) => `${p.education.length} ${p.education.length === 1 ? "entry" : "entries"}`,
	},
	{
		id: "projects",
		label: "Projects & Volunteer",
		icon: FolderSimpleIcon,
		description: (p) => `${p.projects.length + p.volunteer.length} entries`,
	},
	{
		id: "credentials",
		label: "Certifications & Awards",
		icon: CertificateIcon,
		description: (p) => `${p.certifications.length + p.awards.length} entries`,
	},
];

const applicationItems: NavigationItem[] = [
	{
		id: "work-authorization",
		label: "Work Authorization",
		icon: IdentificationCardIcon,
		description: (p) => p.workAuthorization.countries.join(", ") || "Add a country",
	},
	{ id: "screening", label: "Screening", icon: ShieldCheckIcon, description: () => "Eligibility & legal" },
	{
		id: "equal-opportunity",
		label: "Equal Opportunity",
		icon: ScalesIcon,
		description: () => "Demographic information",
	},
];

type ProfileNavigationProps = {
	active: ProfileSectionId;
	onSelect: (id: ProfileSectionId) => void;
	profile: ApplicationProfile;
	resumeCount: number;
};

function NavigationButton({
	item,
	active,
	onSelect,
	profile,
	resumeCount,
}: { item: NavigationItem } & ProfileNavigationProps) {
	const Icon = item.icon;
	return (
		<button
			type="button"
			aria-label={item.label}
			onClick={() => onSelect(item.id)}
			className={cn(
				"flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
				active === item.id ? "bg-violet-100 text-violet-700" : "text-foreground hover:bg-muted/70",
			)}
		>
			<Icon className="size-5 shrink-0 text-current" />
			<span className="min-w-0 flex-1">
				<span className="block truncate font-medium text-sm">{item.label}</span>
				<span className="block truncate text-muted-foreground text-xs">{item.description(profile, resumeCount)}</span>
			</span>
		</button>
	);
}

export function ProfileNavigation(props: ProfileNavigationProps) {
	return (
		<aside className="border-border border-r bg-white p-4">
			<button
				type="button"
				aria-label="Job Preferences"
				onClick={() => props.onSelect("job-preferences")}
				className={cn(
					"mb-4 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left",
					props.active === "job-preferences" ? "bg-violet-100 text-violet-700" : "hover:bg-muted/70",
				)}
			>
				<span className="grid size-10 place-items-center rounded-md bg-violet-600 text-white">
					<SlidersHorizontalIcon className="size-5" />
				</span>
				<span>
					<span className="block font-semibold text-sm">Job Preferences</span>
					<span className="block text-emerald-600 text-xs">Complete your targets</span>
				</span>
			</button>

			<p className="px-3 pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">About you</p>
			<div className="grid gap-0.5">
				{aboutItems.map((item) => (
					<NavigationButton key={item.id} item={item} {...props} />
				))}
			</div>

			<p className="mt-5 px-3 pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
				Application Questions
			</p>
			<div className="grid gap-0.5">
				{applicationItems.map((item) => (
					<NavigationButton key={item.id} item={item} {...props} />
				))}
			</div>
		</aside>
	);
}
