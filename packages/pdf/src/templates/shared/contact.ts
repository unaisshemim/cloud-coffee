import type { ProfileItem } from "@reactive-resume/schema/resume/data";

type WebsiteDisplay = {
	url: string;
	label?: string | undefined;
};

type CustomFieldLink = {
	link?: string | undefined;
};

export type ContactIconKind = "email" | "location" | "phone" | "profile" | "website";

const CONTACT_ICON_NAMES = {
	email: "mail",
	phone: "phone",
	location: "map-pin",
	website: "globe",
	profile: "link",
} as const;

export const getContactIconDescriptor = (kind: ContactIconKind) => ({
	library: "lucide" as const,
	name: CONTACT_ICON_NAMES[kind],
});

export const getWebsiteDisplayText = (website: WebsiteDisplay): string => {
	const label = website.label?.trim();

	return label || website.url;
};

export const getCustomFieldLinkUrl = (field: CustomFieldLink): string | undefined => {
	const link = field.link?.trim();

	return link || undefined;
};

const normalizeProfileUrl = (url: string): string => url.trim().replace(/\/+$/, "").toLocaleLowerCase();

export const getHeaderProfiles = (items: ProfileItem[], primaryWebsiteUrl: string): ProfileItem[] => {
	const primaryWebsite = normalizeProfileUrl(primaryWebsiteUrl);

	return items.filter((item) => {
		const profileUrl = normalizeProfileUrl(item.website.url);
		return !item.hidden && Boolean(profileUrl) && profileUrl !== primaryWebsite;
	});
};

export const getProfileDisplayText = (profile: ProfileItem): string =>
	profile.website.url
		.trim()
		.replace(/^https?:\/\//i, "")
		.replace(/\/+$/, "");
