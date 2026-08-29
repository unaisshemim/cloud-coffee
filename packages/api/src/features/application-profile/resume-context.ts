import type { ApplicationProfile } from "@reactive-resume/schema/application-profile";

export type ResumeSafeProfileContext = Pick<
	ApplicationProfile,
	| "careerSummary"
	| "personal"
	| "skills"
	| "languages"
	| "experience"
	| "education"
	| "projects"
	| "volunteer"
	| "certifications"
	| "awards"
	| "achievements"
	| "hackathons"
	| "publications"
	| "customFacts"
>;

export function buildResumeSafeProfileContext(profile: ApplicationProfile): ResumeSafeProfileContext {
	return {
		careerSummary: profile.careerSummary,
		personal: profile.personal,
		skills: profile.skills,
		languages: profile.languages,
		experience: profile.experience,
		education: profile.education,
		projects: profile.projects,
		volunteer: profile.volunteer,
		certifications: profile.certifications,
		awards: profile.awards,
		achievements: profile.achievements,
		hackathons: profile.hackathons,
		publications: profile.publications,
		customFacts: profile.customFacts,
	};
}
