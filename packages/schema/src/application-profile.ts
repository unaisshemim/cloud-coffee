import { z } from "zod";

const nullableBoolean = z.boolean().nullable();

const datedEntrySchema = z.object({
	id: z.string().min(1),
	startDate: z.string(),
	endDate: z.string(),
	current: z.boolean(),
	description: z.string(),
});

const experienceSchema = datedEntrySchema.extend({
	title: z.string(),
	company: z.string(),
	location: z.string(),
});

const educationSchema = datedEntrySchema.extend({
	institution: z.string(),
	degree: z.string(),
	field: z.string(),
	location: z.string(),
});

const projectSchema = datedEntrySchema.extend({
	name: z.string(),
	url: z.string(),
});

const volunteerSchema = datedEntrySchema.extend({
	role: z.string(),
	organization: z.string(),
});

const credentialSchema = z.object({
	id: z.string().min(1),
	name: z.string(),
	organization: z.string(),
	issueDate: z.string(),
	expiryDate: z.string(),
	description: z.string(),
});

const savedAnswerSchema = z.object({
	id: z.string().min(1),
	question: z.string(),
	answer: z.string(),
});

export const applicationProfileSchema = z.object({
	version: z.literal(1),
	jobPreferences: z.object({
		targetRoles: z.array(z.string()),
		preferredLocations: z.array(z.string()),
		openToRelocation: nullableBoolean,
		workplaces: z.array(z.string()),
		experienceLevels: z.array(z.string()),
		employmentTypes: z.array(z.string()),
		industries: z.array(z.string()),
		companySizes: z.array(z.string()),
		minimumSalary: z.object({ currency: z.string(), amount: z.string(), period: z.string() }),
	}),
	personal: z.object({
		firstName: z.string(),
		lastName: z.string(),
		email: z.string(),
		phone: z.string(),
		country: z.string(),
		city: z.string(),
		state: z.string(),
		postalCode: z.string(),
		address: z.string(),
		links: z.object({
			linkedin: z.string(),
			github: z.string(),
			portfolio: z.string(),
			website: z.string(),
		}),
	}),
	skills: z.array(z.string()),
	languages: z.array(z.string()),
	experience: z.array(experienceSchema),
	education: z.array(educationSchema),
	projects: z.array(projectSchema),
	volunteer: z.array(volunteerSchema),
	certifications: z.array(credentialSchema),
	awards: z.array(credentialSchema),
	workAuthorization: z.object({
		countries: z.array(z.string()),
		requiresSponsorship: nullableBoolean,
	}),
	screening: z.object({
		nonCompete: nullableBoolean,
		backgroundCheck: nullableBoolean,
		driversLicense: nullableBoolean,
		securityClearance: z.string(),
		availableFrom: z.string(),
		savedAnswers: z.array(savedAnswerSchema),
	}),
	equalOpportunity: z.object({
		gender: z.string(),
		pronouns: z.string(),
		birthDate: z.string(),
		disability: z.string(),
		veteranStatus: z.string(),
		ethnicity: z.string(),
		sexualOrientation: z.string(),
	}),
});

export type ApplicationProfile = z.infer<typeof applicationProfileSchema>;

export const defaultApplicationProfile = {
	version: 1,
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
