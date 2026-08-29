import type { ApplicationProfile } from "@reactive-resume/schema/application-profile";

export type ProfileSectionId =
	| "job-preferences"
	| "career-knowledge"
	| "personal"
	| "documents"
	| "skills"
	| "experience"
	| "education"
	| "projects"
	| "credentials"
	| "work-authorization"
	| "screening"
	| "equal-opportunity";

export type ResumeSummary = {
	id: string;
	name: string;
	updatedAt?: Date | string;
};

export type ProfileWorkspaceProps = {
	profile: ApplicationProfile;
	resumes: ResumeSummary[];
	onChange: (profile: ApplicationProfile) => void;
	onSave: () => void;
	isSaving: boolean;
};
