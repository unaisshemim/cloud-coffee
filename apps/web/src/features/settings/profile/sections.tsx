import type { ApplicationProfile } from "@reactive-resume/schema/application-profile";
import type { ProfileSectionId, ResumeSummary } from "./types";
import {
	BriefcaseIcon,
	CertificateIcon,
	FileTextIcon,
	FolderSimpleIcon,
	GraduationCapIcon,
	IdentificationCardIcon,
	PlusIcon,
	ScalesIcon,
	ShieldCheckIcon,
	SlidersHorizontalIcon,
	TrashIcon,
	UserIcon,
	WrenchIcon,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { generateId } from "@reactive-resume/utils/string";
import { BooleanChoice, EmptyPanel, ProfileField, ProfileTextarea, TagEditor } from "./fields";

type ProfileSectionsProps = {
	active: ProfileSectionId;
	profile: ApplicationProfile;
	resumes: ResumeSummary[];
	onChange: (profile: ApplicationProfile) => void;
};

const sectionMeta = {
	"job-preferences": {
		title: "Job Preferences",
		description: "Drives which jobs cloudcoffee finds and prioritizes for you.",
		icon: SlidersHorizontalIcon,
	},
	"career-knowledge": {
		title: "Career Knowledge",
		description: "Approved facts ChatGPT can reuse when building a targeted resume.",
		icon: BriefcaseIcon,
	},
	personal: {
		title: "Personal info",
		description: "The basics employers and ATS forms always ask for.",
		icon: UserIcon,
	},
	documents: { title: "Documents", description: "Resumes available for your applications.", icon: FileTextIcon },
	skills: {
		title: "Skills & Languages",
		description: "Skills cloudcoffee matches against job requirements.",
		icon: WrenchIcon,
	},
	experience: {
		title: "Work Experience",
		description: "Roles and outcomes to reuse in applications.",
		icon: BriefcaseIcon,
	},
	education: {
		title: "Education",
		description: "Schools, qualifications, and fields of study.",
		icon: GraduationCapIcon,
	},
	projects: {
		title: "Projects & Volunteer",
		description: "Personal work and causes you support.",
		icon: FolderSimpleIcon,
	},
	credentials: {
		title: "Certifications & Awards",
		description: "Credentials cloudcoffee can highlight on applications.",
		icon: CertificateIcon,
	},
	"work-authorization": {
		title: "Work Authorization",
		description: "Countries where you can legally work and sponsorship needs.",
		icon: IdentificationCardIcon,
	},
	screening: {
		title: "Screening",
		description: "Eligibility and legal answers cloudcoffee reuses on applications.",
		icon: ShieldCheckIcon,
	},
	"equal-opportunity": {
		title: "Equal Opportunity",
		description: "Optional demographic information stored privately.",
		icon: ScalesIcon,
	},
} as const;

function SectionHeader({ active }: { active: ProfileSectionId }) {
	const meta = sectionMeta[active];
	const Icon = meta.icon;
	return (
		<header className="flex items-center gap-4 border-border border-b bg-white px-7 py-5">
			<span className="grid size-11 place-items-center rounded-md bg-muted text-muted-foreground">
				<Icon className="size-6" />
			</span>
			<div>
				<h2 className="font-semibold text-2xl tracking-normal">{meta.title}</h2>
				<p className="mt-0.5 text-muted-foreground text-sm">{meta.description}</p>
			</div>
		</header>
	);
}

type CollectionEditorProps<T extends { id: string }> = {
	title: string;
	items: T[];
	emptyTitle: string;
	emptyDescription: string;
	action: string;
	icon: React.ReactNode;
	create: () => T;
	onChange: (items: T[]) => void;
	render: (item: T, update: (item: T) => void) => React.ReactNode;
};

function CollectionEditor<T extends { id: string }>(props: CollectionEditorProps<T>) {
	return (
		<section className="grid gap-3">
			<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">{props.title}</h3>
			{props.items.length === 0 ? (
				<EmptyPanel
					title={props.emptyTitle}
					description={props.emptyDescription}
					action={props.action}
					icon={props.icon}
					onAdd={() => props.onChange([...props.items, props.create()])}
				/>
			) : (
				<div className="grid gap-3">
					{props.items.map((item) => (
						<div key={item.id} className="relative grid gap-4 rounded-md border bg-white p-5">
							<Button
								type="button"
								size="icon-sm"
								variant="ghost"
								aria-label={`Remove ${props.title}`}
								className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
								onClick={() => props.onChange(props.items.filter((entry) => entry.id !== item.id))}
							>
								<TrashIcon />
							</Button>
							{props.render(item, (next) =>
								props.onChange(props.items.map((entry) => (entry.id === item.id ? next : entry))),
							)}
						</div>
					))}
					<Button
						type="button"
						variant="outline"
						className="justify-self-start rounded-full"
						onClick={() => props.onChange([...props.items, props.create()])}
					>
						<PlusIcon />
						{props.action}
					</Button>
				</div>
			)}
		</section>
	);
}

function JobPreferences({ profile, onChange }: Omit<ProfileSectionsProps, "active" | "resumes">) {
	const value = profile.jobPreferences;
	const update = (next: Partial<typeof value>) => onChange({ ...profile, jobPreferences: { ...value, ...next } });
	return (
		<div className="grid gap-5">
			<TagEditor
				label="Target roles"
				values={value.targetRoles}
				onChange={(targetRoles) => update({ targetRoles })}
				placeholder="Add a target role..."
			/>
			<TagEditor
				label="Preferred locations"
				values={value.preferredLocations}
				onChange={(preferredLocations) => update({ preferredLocations })}
				placeholder="Add another location..."
			/>
			<BooleanChoice
				label="Open to relocation?"
				value={value.openToRelocation}
				onChange={(openToRelocation) => update({ openToRelocation })}
			/>
			<TagEditor
				label="Workplace"
				values={value.workplaces}
				onChange={(workplaces) => update({ workplaces })}
				placeholder="On-site, hybrid, or remote..."
			/>
			<div className="grid gap-5 md:grid-cols-2">
				<TagEditor
					label="Experience level"
					values={value.experienceLevels}
					onChange={(experienceLevels) => update({ experienceLevels })}
					placeholder="Add level..."
				/>
				<TagEditor
					label="Employment type"
					values={value.employmentTypes}
					onChange={(employmentTypes) => update({ employmentTypes })}
					placeholder="Add type..."
				/>
				<TagEditor
					label="Industry"
					values={value.industries}
					onChange={(industries) => update({ industries })}
					placeholder="Add industry..."
				/>
				<TagEditor
					label="Company size"
					values={value.companySizes}
					onChange={(companySizes) => update({ companySizes })}
					placeholder="Add company size..."
				/>
			</div>
			<div className="grid gap-4 md:grid-cols-3">
				<ProfileField
					label="Minimum salary"
					value={value.minimumSalary.amount}
					onChange={(amount) => update({ minimumSalary: { ...value.minimumSalary, amount } })}
					placeholder="100000"
				/>
				<ProfileField
					label="Currency"
					value={value.minimumSalary.currency}
					onChange={(currency) => update({ minimumSalary: { ...value.minimumSalary, currency } })}
					placeholder="USD"
				/>
				<ProfileField
					label="Period"
					value={value.minimumSalary.period}
					onChange={(period) => update({ minimumSalary: { ...value.minimumSalary, period } })}
					placeholder="Year"
				/>
			</div>
		</div>
	);
}

function PersonalInfo({ profile, onChange }: Omit<ProfileSectionsProps, "active" | "resumes">) {
	const value = profile.personal;
	const update = (next: Partial<typeof value>) => onChange({ ...profile, personal: { ...value, ...next } });
	return (
		<div className="grid gap-5">
			<div className="grid gap-4 md:grid-cols-2">
				<ProfileField label="First name" value={value.firstName} onChange={(firstName) => update({ firstName })} />
				<ProfileField label="Last name" value={value.lastName} onChange={(lastName) => update({ lastName })} />
				<ProfileField
					label="Application email"
					type="email"
					value={value.email}
					onChange={(email) => update({ email })}
				/>
				<ProfileField label="Phone" type="tel" value={value.phone} onChange={(phone) => update({ phone })} />
				<ProfileField label="Country" value={value.country} onChange={(country) => update({ country })} />
				<ProfileField label="City" value={value.city} onChange={(city) => update({ city })} />
				<ProfileField label="State / region" value={value.state} onChange={(state) => update({ state })} />
				<ProfileField label="Postal code" value={value.postalCode} onChange={(postalCode) => update({ postalCode })} />
			</div>
			<ProfileField label="Address line 1" value={value.address} onChange={(address) => update({ address })} />
			<div className="border-border border-t pt-5">
				<h3 className="mb-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Links</h3>
				<div className="grid gap-4 md:grid-cols-2">
					{Object.entries(value.links).map(([key, link]) => (
						<ProfileField
							key={key}
							label={
								key === "linkedin"
									? "LinkedIn"
									: key === "github"
										? "GitHub"
										: (key[0] ?? "").toUpperCase() + key.slice(1)
							}
							value={link}
							onChange={(next) => update({ links: { ...value.links, [key]: next } })}
							placeholder="https://"
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function Documents({ resumes }: { resumes: ResumeSummary[] }) {
	return resumes.length === 0 ? (
		<EmptyPanel
			title="No resumes yet"
			description="Create a resume before attaching it to job applications."
			action="Create resume"
			icon={<FileTextIcon className="size-6" />}
			onAdd={() => window.location.assign("/dashboard/resumes")}
		/>
	) : (
		<div className="grid gap-3 sm:grid-cols-2">
			{resumes.map((resume) => (
				<Link
					key={resume.id}
					to="/builder/$resumeId"
					params={{ resumeId: resume.id }}
					className="flex items-center gap-3 rounded-md border bg-white p-4 hover:border-violet-300 hover:bg-violet-50/30"
				>
					<span className="grid size-10 place-items-center rounded-md bg-muted">
						<FileTextIcon className="size-5" />
					</span>
					<span className="min-w-0">
						<span className="block truncate font-medium text-sm">{resume.name}</span>
						<span className="text-muted-foreground text-xs">Open resume builder</span>
					</span>
				</Link>
			))}
		</div>
	);
}

function Skills({ profile, onChange }: Omit<ProfileSectionsProps, "active" | "resumes">) {
	return (
		<div className="grid gap-6">
			<TagEditor
				label={`Skills · ${profile.skills.length}`}
				values={profile.skills}
				onChange={(skills) => onChange({ ...profile, skills })}
				placeholder="Type to add a skill..."
			/>
			<TagEditor
				label={`Languages · ${profile.languages.length}`}
				values={profile.languages}
				onChange={(languages) => onChange({ ...profile, languages })}
				placeholder="Type to add a language..."
			/>
		</div>
	);
}

function CareerKnowledge({ profile, onChange }: Omit<ProfileSectionsProps, "active" | "resumes">) {
	return (
		<div className="grid gap-8">
			<ProfileTextarea
				label="Career summary"
				value={profile.careerSummary}
				onChange={(careerSummary) => onChange({ ...profile, careerSummary })}
			/>
			<CollectionEditor
				title="Achievements"
				items={profile.achievements}
				emptyTitle="No achievements yet"
				emptyDescription="Add verified outcomes, wins, and measurable impact."
				action="Add achievement"
				icon={<CertificateIcon className="size-6" />}
				create={() => ({
					id: generateId(),
					title: "",
					description: "",
					metrics: [],
					skills: [],
					relatedExperienceId: null,
					relatedProjectId: null,
				})}
				onChange={(achievements) => onChange({ ...profile, achievements })}
				render={(item, update) => (
					<>
						<div className="pr-10">
							<ProfileField label="Title" value={item.title} onChange={(title) => update({ ...item, title })} />
						</div>
						<ProfileTextarea
							label="What happened"
							value={item.description}
							onChange={(description) => update({ ...item, description })}
						/>
						<div className="grid gap-4 md:grid-cols-2">
							<TagEditor
								label="Verified metrics"
								values={item.metrics}
								onChange={(metrics) => update({ ...item, metrics })}
								placeholder="35% faster..."
							/>
							<TagEditor
								label="Skills used"
								values={item.skills}
								onChange={(skills) => update({ ...item, skills })}
								placeholder="Add skill..."
							/>
						</div>
					</>
				)}
			/>
			<CollectionEditor
				title="Hackathons"
				items={profile.hackathons}
				emptyTitle="No hackathons yet"
				emptyDescription="Keep projects, placements, and demos ready for future applications."
				action="Add hackathon"
				icon={<FolderSimpleIcon className="size-6" />}
				create={() => ({
					id: generateId(),
					event: "",
					project: "",
					date: "",
					placement: "",
					url: "",
					description: "",
					highlights: [],
				})}
				onChange={(hackathons) => onChange({ ...profile, hackathons })}
				render={(item, update) => (
					<>
						<div className="grid gap-4 pr-10 md:grid-cols-2">
							<ProfileField label="Event" value={item.event} onChange={(event) => update({ ...item, event })} />
							<ProfileField label="Project" value={item.project} onChange={(project) => update({ ...item, project })} />
							<ProfileField label="Date" type="date" value={item.date} onChange={(date) => update({ ...item, date })} />
							<ProfileField
								label="Placement"
								value={item.placement}
								onChange={(placement) => update({ ...item, placement })}
							/>
							<ProfileField label="URL" value={item.url} onChange={(url) => update({ ...item, url })} />
						</div>
						<ProfileTextarea
							label="Description"
							value={item.description}
							onChange={(description) => update({ ...item, description })}
						/>
						<TagEditor
							label="Highlights"
							values={item.highlights}
							onChange={(highlights) => update({ ...item, highlights })}
							placeholder="Add verified highlight..."
						/>
					</>
				)}
			/>
			<CollectionEditor
				title="Publications"
				items={profile.publications}
				emptyTitle="No publications yet"
				emptyDescription="Add articles, papers, talks, or published work."
				action="Add publication"
				icon={<FileTextIcon className="size-6" />}
				create={() => ({
					id: generateId(),
					title: "",
					publisher: "",
					publicationDate: "",
					url: "",
					description: "",
				})}
				onChange={(publications) => onChange({ ...profile, publications })}
				render={(item, update) => (
					<>
						<div className="grid gap-4 pr-10 md:grid-cols-2">
							<ProfileField label="Title" value={item.title} onChange={(title) => update({ ...item, title })} />
							<ProfileField
								label="Publisher"
								value={item.publisher}
								onChange={(publisher) => update({ ...item, publisher })}
							/>
							<ProfileField
								label="Published"
								type="date"
								value={item.publicationDate}
								onChange={(publicationDate) => update({ ...item, publicationDate })}
							/>
							<ProfileField label="URL" value={item.url} onChange={(url) => update({ ...item, url })} />
						</div>
						<ProfileTextarea
							label="Description"
							value={item.description}
							onChange={(description) => update({ ...item, description })}
						/>
					</>
				)}
			/>
			<CollectionEditor
				title="Custom facts"
				items={profile.customFacts}
				emptyTitle="No custom facts yet"
				emptyDescription="Store useful career context that does not fit another section."
				action="Add custom fact"
				icon={<IdentificationCardIcon className="size-6" />}
				create={() => ({ id: generateId(), category: "", label: "", value: "" })}
				onChange={(customFacts) => onChange({ ...profile, customFacts })}
				render={(item, update) => (
					<div className="grid gap-4 pr-10 md:grid-cols-2">
						<ProfileField
							label="Category"
							value={item.category}
							onChange={(category) => update({ ...item, category })}
						/>
						<ProfileField label="Label" value={item.label} onChange={(label) => update({ ...item, label })} />
						<div className="md:col-span-2">
							<ProfileTextarea label="Value" value={item.value} onChange={(value) => update({ ...item, value })} />
						</div>
					</div>
				)}
			/>
		</div>
	);
}

function Experience({ profile, onChange }: Omit<ProfileSectionsProps, "active" | "resumes">) {
	return (
		<CollectionEditor
			title="Experience"
			items={profile.experience}
			emptyTitle="No work experience yet"
			emptyDescription="Add roles cloudcoffee can reuse when tailoring applications."
			action="Add experience"
			icon={<BriefcaseIcon className="size-6" />}
			create={() => ({
				id: generateId(),
				title: "",
				company: "",
				location: "",
				startDate: "",
				endDate: "",
				current: false,
				description: "",
				highlights: [],
			})}
			onChange={(experience) => onChange({ ...profile, experience })}
			render={(item, update) => (
				<>
					<div className="grid gap-4 pr-10 md:grid-cols-2">
						<ProfileField label="Role" value={item.title} onChange={(title) => update({ ...item, title })} />
						<ProfileField label="Company" value={item.company} onChange={(company) => update({ ...item, company })} />
						<ProfileField
							label="Location"
							value={item.location}
							onChange={(location) => update({ ...item, location })}
						/>
						<ProfileField
							label="Start date"
							type="month"
							value={item.startDate}
							onChange={(startDate) => update({ ...item, startDate })}
						/>
						<ProfileField
							label="End date"
							type="month"
							value={item.endDate}
							onChange={(endDate) => update({ ...item, endDate })}
						/>
					</div>
					<ProfileTextarea
						label="Description"
						value={item.description}
						onChange={(description) => update({ ...item, description })}
					/>
					<TagEditor
						label="Highlights"
						values={item.highlights}
						onChange={(highlights) => update({ ...item, highlights })}
						placeholder="Add verified impact..."
					/>
				</>
			)}
		/>
	);
}

function Education({ profile, onChange }: Omit<ProfileSectionsProps, "active" | "resumes">) {
	return (
		<CollectionEditor
			title="Education"
			items={profile.education}
			emptyTitle="No education yet"
			emptyDescription="Add schools, degrees, and qualifications."
			action="Add education"
			icon={<GraduationCapIcon className="size-6" />}
			create={() => ({
				id: generateId(),
				institution: "",
				degree: "",
				field: "",
				location: "",
				startDate: "",
				endDate: "",
				current: false,
				description: "",
			})}
			onChange={(education) => onChange({ ...profile, education })}
			render={(item, update) => (
				<>
					<div className="grid gap-4 pr-10 md:grid-cols-2">
						<ProfileField
							label="Institution"
							value={item.institution}
							onChange={(institution) => update({ ...item, institution })}
						/>
						<ProfileField label="Degree" value={item.degree} onChange={(degree) => update({ ...item, degree })} />
						<ProfileField label="Field of study" value={item.field} onChange={(field) => update({ ...item, field })} />
						<ProfileField
							label="Location"
							value={item.location}
							onChange={(location) => update({ ...item, location })}
						/>
						<ProfileField
							label="Start date"
							type="month"
							value={item.startDate}
							onChange={(startDate) => update({ ...item, startDate })}
						/>
						<ProfileField
							label="End date"
							type="month"
							value={item.endDate}
							onChange={(endDate) => update({ ...item, endDate })}
						/>
					</div>
					<ProfileTextarea
						label="Description"
						value={item.description}
						onChange={(description) => update({ ...item, description })}
					/>
				</>
			)}
		/>
	);
}

function Projects({ profile, onChange }: Omit<ProfileSectionsProps, "active" | "resumes">) {
	return (
		<div className="grid gap-8">
			<CollectionEditor
				title="Projects"
				items={profile.projects}
				emptyTitle="No projects yet"
				emptyDescription="Add side projects or work you are proud of."
				action="Add project"
				icon={<FolderSimpleIcon className="size-6" />}
				create={() => ({
					id: generateId(),
					name: "",
					url: "",
					startDate: "",
					endDate: "",
					current: false,
					description: "",
					highlights: [],
				})}
				onChange={(projects) => onChange({ ...profile, projects })}
				render={(item, update) => (
					<>
						<div className="grid gap-4 pr-10 md:grid-cols-2">
							<ProfileField label="Project name" value={item.name} onChange={(name) => update({ ...item, name })} />
							<ProfileField label="URL" value={item.url} onChange={(url) => update({ ...item, url })} />
							<ProfileField
								label="Start date"
								type="month"
								value={item.startDate}
								onChange={(startDate) => update({ ...item, startDate })}
							/>
							<ProfileField
								label="End date"
								type="month"
								value={item.endDate}
								onChange={(endDate) => update({ ...item, endDate })}
							/>
						</div>
						<ProfileTextarea
							label="Description"
							value={item.description}
							onChange={(description) => update({ ...item, description })}
						/>
						<TagEditor
							label="Highlights"
							values={item.highlights}
							onChange={(highlights) => update({ ...item, highlights })}
							placeholder="Add verified impact..."
						/>
					</>
				)}
			/>
			<CollectionEditor
				title="Volunteer"
				items={profile.volunteer}
				emptyTitle="No volunteer experience yet"
				emptyDescription="Causes you support help recruiters see the whole you."
				action="Add volunteering"
				icon={<IdentificationCardIcon className="size-6" />}
				create={() => ({
					id: generateId(),
					role: "",
					organization: "",
					startDate: "",
					endDate: "",
					current: false,
					description: "",
				})}
				onChange={(volunteer) => onChange({ ...profile, volunteer })}
				render={(item, update) => (
					<>
						<div className="grid gap-4 pr-10 md:grid-cols-2">
							<ProfileField label="Role" value={item.role} onChange={(role) => update({ ...item, role })} />
							<ProfileField
								label="Organization"
								value={item.organization}
								onChange={(organization) => update({ ...item, organization })}
							/>
							<ProfileField
								label="Start date"
								type="month"
								value={item.startDate}
								onChange={(startDate) => update({ ...item, startDate })}
							/>
							<ProfileField
								label="End date"
								type="month"
								value={item.endDate}
								onChange={(endDate) => update({ ...item, endDate })}
							/>
						</div>
						<ProfileTextarea
							label="Description"
							value={item.description}
							onChange={(description) => update({ ...item, description })}
						/>
					</>
				)}
			/>
		</div>
	);
}

function Credentials({ profile, onChange }: Omit<ProfileSectionsProps, "active" | "resumes">) {
	const create = () => ({
		id: generateId(),
		name: "",
		organization: "",
		issueDate: "",
		expiryDate: "",
		description: "",
	});
	const render = (
		item: (typeof profile.certifications)[number],
		update: (item: (typeof profile.certifications)[number]) => void,
	) => (
		<>
			<div className="grid gap-4 pr-10 md:grid-cols-2">
				<ProfileField label="Name" value={item.name} onChange={(name) => update({ ...item, name })} />
				<ProfileField
					label="Organization"
					value={item.organization}
					onChange={(organization) => update({ ...item, organization })}
				/>
				<ProfileField
					label="Issue date"
					type="month"
					value={item.issueDate}
					onChange={(issueDate) => update({ ...item, issueDate })}
				/>
				<ProfileField
					label="Expiry date"
					type="month"
					value={item.expiryDate}
					onChange={(expiryDate) => update({ ...item, expiryDate })}
				/>
			</div>
			<ProfileTextarea
				label="Description"
				value={item.description}
				onChange={(description) => update({ ...item, description })}
			/>
		</>
	);
	return (
		<div className="grid gap-8">
			<CollectionEditor
				title="Certifications"
				items={profile.certifications}
				emptyTitle="No certifications yet"
				emptyDescription="List certifications you have earned."
				action="Add certification"
				icon={<CertificateIcon className="size-6" />}
				create={create}
				onChange={(certifications) => onChange({ ...profile, certifications })}
				render={render}
			/>
			<CollectionEditor
				title="Awards"
				items={profile.awards}
				emptyTitle="No awards yet"
				emptyDescription="Add awards and honors that help you stand out."
				action="Add award"
				icon={<CertificateIcon className="size-6" />}
				create={create}
				onChange={(awards) => onChange({ ...profile, awards })}
				render={render}
			/>
		</div>
	);
}

function WorkAuthorization({ profile, onChange }: Omit<ProfileSectionsProps, "active" | "resumes">) {
	const value = profile.workAuthorization;
	return (
		<div className="grid gap-5">
			<TagEditor
				label="Authorized countries"
				values={value.countries}
				onChange={(countries) => onChange({ ...profile, workAuthorization: { ...value, countries } })}
				placeholder="Add a country..."
			/>
			<BooleanChoice
				label="Will you require visa sponsorship?"
				value={value.requiresSponsorship}
				onChange={(requiresSponsorship) =>
					onChange({ ...profile, workAuthorization: { ...value, requiresSponsorship } })
				}
			/>
		</div>
	);
}

function Screening({ profile, onChange }: Omit<ProfileSectionsProps, "active" | "resumes">) {
	const value = profile.screening;
	const update = (next: Partial<typeof value>) => onChange({ ...profile, screening: { ...value, ...next } });
	return (
		<div className="grid gap-5">
			<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Eligibility & legal</h3>
			<BooleanChoice
				label="Are you subject to a restrictive agreement?"
				value={value.nonCompete}
				onChange={(nonCompete) => update({ nonCompete })}
			/>
			<BooleanChoice
				label="Are you willing to undergo a background check?"
				value={value.backgroundCheck}
				onChange={(backgroundCheck) => update({ backgroundCheck })}
			/>
			<BooleanChoice
				label="Do you have a valid driver's license?"
				value={value.driversLicense}
				onChange={(driversLicense) => update({ driversLicense })}
			/>
			<div className="grid gap-4 md:grid-cols-2">
				<ProfileField
					label="Highest security clearance"
					value={value.securityClearance}
					onChange={(securityClearance) => update({ securityClearance })}
				/>
				<ProfileField
					label="When can you start?"
					type="date"
					value={value.availableFrom}
					onChange={(availableFrom) => update({ availableFrom })}
				/>
			</div>
			<CollectionEditor
				title="Saved answers"
				items={value.savedAnswers}
				emptyTitle="No saved answers yet"
				emptyDescription="Save answers to recurring application questions."
				action="Add answer"
				icon={<ShieldCheckIcon className="size-6" />}
				create={() => ({ id: generateId(), question: "", answer: "" })}
				onChange={(savedAnswers) => update({ savedAnswers })}
				render={(item, change) => (
					<div className="grid gap-4 pr-10">
						<ProfileTextarea
							label="Question"
							value={item.question}
							onChange={(question) => change({ ...item, question })}
						/>
						<ProfileTextarea label="Answer" value={item.answer} onChange={(answer) => change({ ...item, answer })} />
					</div>
				)}
			/>
		</div>
	);
}

function EqualOpportunity({ profile, onChange }: Omit<ProfileSectionsProps, "active" | "resumes">) {
	const value = profile.equalOpportunity;
	const update = (next: Partial<typeof value>) => onChange({ ...profile, equalOpportunity: { ...value, ...next } });
	return (
		<div className="grid gap-4 md:grid-cols-2">
			<ProfileField
				label="Gender"
				value={value.gender}
				onChange={(gender) => update({ gender })}
				placeholder="Select..."
			/>
			<ProfileField
				label="Pronouns"
				value={value.pronouns}
				onChange={(pronouns) => update({ pronouns })}
				placeholder="Select..."
			/>
			<ProfileField
				label="Date of birth"
				type="date"
				value={value.birthDate}
				onChange={(birthDate) => update({ birthDate })}
			/>
			<ProfileField
				label="Do you have a physical disability?"
				value={value.disability}
				onChange={(disability) => update({ disability })}
				placeholder="Select..."
			/>
			<ProfileField
				label="Veteran status"
				value={value.veteranStatus}
				onChange={(veteranStatus) => update({ veteranStatus })}
				placeholder="Select..."
			/>
			<ProfileField
				label="Ethnicity"
				value={value.ethnicity}
				onChange={(ethnicity) => update({ ethnicity })}
				placeholder="Select..."
			/>
			<ProfileField
				label="Sexual orientation"
				value={value.sexualOrientation}
				onChange={(sexualOrientation) => update({ sexualOrientation })}
				placeholder="Select..."
			/>
		</div>
	);
}

export function ProfileSections(props: ProfileSectionsProps) {
	let content: React.ReactNode;
	switch (props.active) {
		case "job-preferences":
			content = <JobPreferences {...props} />;
			break;
		case "career-knowledge":
			content = <CareerKnowledge {...props} />;
			break;
		case "personal":
			content = <PersonalInfo {...props} />;
			break;
		case "documents":
			content = <Documents resumes={props.resumes} />;
			break;
		case "skills":
			content = <Skills {...props} />;
			break;
		case "experience":
			content = <Experience {...props} />;
			break;
		case "education":
			content = <Education {...props} />;
			break;
		case "projects":
			content = <Projects {...props} />;
			break;
		case "credentials":
			content = <Credentials {...props} />;
			break;
		case "work-authorization":
			content = <WorkAuthorization {...props} />;
			break;
		case "screening":
			content = <Screening {...props} />;
			break;
		case "equal-opportunity":
			content = <EqualOpportunity {...props} />;
			break;
	}
	return (
		<div className="min-w-0 bg-[#fcfaf7]">
			<SectionHeader active={props.active} />
			<div className="p-7">{content}</div>
		</div>
	);
}
