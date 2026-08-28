import { z } from "zod";

const nullableBoolean = z.boolean().nullable();
const text = z.string().max(4_000);
const shortText = z.string().max(240);
const stringList = z.array(shortText).max(200);

const datedEntryV1Schema = z.object({
	id: z.string().min(1),
	startDate: z.string(),
	endDate: z.string(),
	current: z.boolean(),
	description: text,
});

const experienceV1Schema = datedEntryV1Schema.extend({
	title: shortText,
	company: shortText,
	location: shortText,
});

const educationSchema = datedEntryV1Schema.extend({
	institution: shortText,
	degree: shortText,
	field: shortText,
	location: shortText,
});

const projectV1Schema = datedEntryV1Schema.extend({ name: shortText, url: z.string().max(2_000) });
const volunteerSchema = datedEntryV1Schema.extend({ role: shortText, organization: shortText });
const credentialSchema = z.object({
	id: z.string().min(1),
	name: shortText,
	organization: shortText,
	issueDate: z.string(),
	expiryDate: z.string(),
	description: text,
});
const savedAnswerSchema = z.object({ id: z.string().min(1), question: text, answer: text });

const applicationProfileV1Schema = z.object({
	version: z.literal(1),
	jobPreferences: z.object({
		targetRoles: stringList,
		preferredLocations: stringList,
		openToRelocation: nullableBoolean,
		workplaces: stringList,
		experienceLevels: stringList,
		employmentTypes: stringList,
		industries: stringList,
		companySizes: stringList,
		minimumSalary: z.object({ currency: shortText, amount: shortText, period: shortText }),
	}),
	personal: z.object({
		firstName: shortText,
		lastName: shortText,
		email: shortText,
		phone: shortText,
		country: shortText,
		city: shortText,
		state: shortText,
		postalCode: shortText,
		address: text,
		links: z.object({
			linkedin: z.string().max(2_000),
			github: z.string().max(2_000),
			portfolio: z.string().max(2_000),
			website: z.string().max(2_000),
		}),
	}),
	skills: stringList,
	languages: stringList,
	experience: z.array(experienceV1Schema).max(200),
	education: z.array(educationSchema).max(200),
	projects: z.array(projectV1Schema).max(200),
	volunteer: z.array(volunteerSchema).max(200),
	certifications: z.array(credentialSchema).max(200),
	awards: z.array(credentialSchema).max(200),
	workAuthorization: z.object({ countries: stringList, requiresSponsorship: nullableBoolean }),
	screening: z.object({
		nonCompete: nullableBoolean,
		backgroundCheck: nullableBoolean,
		driversLicense: nullableBoolean,
		securityClearance: shortText,
		availableFrom: z.string(),
		savedAnswers: z.array(savedAnswerSchema).max(200),
	}),
	equalOpportunity: z.object({
		gender: shortText,
		pronouns: shortText,
		birthDate: z.string(),
		disability: shortText,
		veteranStatus: shortText,
		ethnicity: shortText,
		sexualOrientation: shortText,
	}),
});

export const experienceSchema = experienceV1Schema.extend({ highlights: stringList });
export const projectSchema = projectV1Schema.extend({ highlights: stringList });
export const achievementSchema = z.object({
	id: z.string().min(1),
	title: shortText,
	description: text,
	metrics: stringList,
	skills: stringList,
	relatedExperienceId: z.string().nullable(),
	relatedProjectId: z.string().nullable(),
});
export const hackathonSchema = z.object({
	id: z.string().min(1),
	event: shortText,
	project: shortText,
	date: z.string(),
	placement: shortText,
	url: z.string().max(2_000),
	description: text,
	highlights: stringList,
});
export const publicationSchema = z.object({
	id: z.string().min(1),
	title: shortText,
	publisher: shortText,
	publicationDate: z.string(),
	url: z.string().max(2_000),
	description: text,
});
export const customFactSchema = z.object({
	id: z.string().min(1),
	category: shortText,
	label: shortText,
	value: text,
});

export const applicationProfileSchema = applicationProfileV1Schema.extend({
	version: z.literal(2),
	careerSummary: text,
	experience: z.array(experienceSchema).max(200),
	projects: z.array(projectSchema).max(200),
	achievements: z.array(achievementSchema).max(200),
	hackathons: z.array(hackathonSchema).max(200),
	publications: z.array(publicationSchema).max(200),
	customFacts: z.array(customFactSchema).max(200),
});

const jobPreferencesCandidateSchema = applicationProfileV1Schema.shape.jobPreferences.partial().extend({
	minimumSalary: applicationProfileV1Schema.shape.jobPreferences.shape.minimumSalary.partial().optional(),
});
const personalCandidateSchema = applicationProfileV1Schema.shape.personal.partial().extend({
	links: applicationProfileV1Schema.shape.personal.shape.links.partial().optional(),
});

export const applicationProfileCandidateSchema = z.strictObject({
	careerSummary: text.optional(),
	jobPreferences: jobPreferencesCandidateSchema.optional(),
	personal: personalCandidateSchema.optional(),
	skills: stringList.optional(),
	languages: stringList.optional(),
	experience: z.array(experienceSchema.partial()).max(200).optional(),
	education: z.array(educationSchema.partial()).max(200).optional(),
	projects: z.array(projectSchema.partial()).max(200).optional(),
	volunteer: z.array(volunteerSchema.partial()).max(200).optional(),
	certifications: z.array(credentialSchema.partial()).max(200).optional(),
	awards: z.array(credentialSchema.partial()).max(200).optional(),
	achievements: z.array(achievementSchema.partial()).max(200).optional(),
	hackathons: z.array(hackathonSchema.partial()).max(200).optional(),
	publications: z.array(publicationSchema.partial()).max(200).optional(),
	customFacts: z.array(customFactSchema.partial()).max(200).optional(),
	workAuthorization: applicationProfileV1Schema.shape.workAuthorization.partial().optional(),
	screening: applicationProfileV1Schema.shape.screening.partial().optional(),
	equalOpportunity: applicationProfileV1Schema.shape.equalOpportunity.partial().optional(),
});

export type ApplicationProfile = z.infer<typeof applicationProfileSchema>;
export type ApplicationProfileCandidate = z.infer<typeof applicationProfileCandidateSchema>;

export const defaultApplicationProfile = {
	version: 2,
	careerSummary: "",
	jobPreferences: {
		targetRoles: [],
		preferredLocations: [],
		openToRelocation: null,
		workplaces: [],
		experienceLevels: [],
		employmentTypes: [],
		industries: [],
		companySizes: [],
		minimumSalary: { currency: "", amount: "", period: "" },
	},
	personal: {
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		country: "",
		city: "",
		state: "",
		postalCode: "",
		address: "",
		links: { linkedin: "", github: "", portfolio: "", website: "" },
	},
	skills: [],
	languages: [],
	experience: [],
	education: [],
	projects: [],
	volunteer: [],
	certifications: [],
	awards: [],
	achievements: [],
	hackathons: [],
	publications: [],
	customFacts: [],
	workAuthorization: { countries: [], requiresSponsorship: null },
	screening: {
		nonCompete: null,
		backgroundCheck: null,
		driversLicense: null,
		securityClearance: "",
		availableFrom: "",
		savedAnswers: [],
	},
	equalOpportunity: {
		gender: "",
		pronouns: "",
		birthDate: "",
		disability: "",
		veteranStatus: "",
		ethnicity: "",
		sexualOrientation: "",
	},
} satisfies ApplicationProfile;

export function parseApplicationProfile(value: unknown): ApplicationProfile {
	const version2 = applicationProfileSchema.safeParse(value);
	if (version2.success) return version2.data;

	const version1 = applicationProfileV1Schema.parse(value);
	return applicationProfileSchema.parse({
		...version1,
		version: 2,
		careerSummary: "",
		experience: version1.experience.map((item) => ({ ...item, highlights: [] })),
		projects: version1.projects.map((item) => ({ ...item, highlights: [] })),
		achievements: [],
		hackathons: [],
		publications: [],
		customFacts: [],
	});
}
