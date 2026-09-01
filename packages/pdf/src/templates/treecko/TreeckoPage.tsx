import type { Style } from "@react-pdf/types";
import type { ProfileItem } from "@reactive-resume/schema/resume/data";
import type { TemplatePageProps } from "../../document";
import type { TemplateColorRoles, TemplateStyleContext, TemplateStyleSlots } from "../shared/types";
import { useMemo } from "react";
import { rgbaStringToHex } from "@reactive-resume/utils/color";
import { Page, StyleSheet } from "#react-pdf-renderer";
import { useRender } from "../../context";
import { useRenderedSectionIds, useResolvedNode } from "../../semantic/context";
import { semanticNodeKeys } from "../../semantic/node-keys";
import { createBaseTemplateStyles } from "../shared/base-template-styles";
import {
	CustomFieldContactItem,
	EmailContactItem,
	LocationContactItem,
	PhoneContactItem,
	ProfileContactItem,
	WebsiteContactItem,
} from "../shared/contact-item";
import { TemplateProvider } from "../shared/context";
import { filterSections } from "../shared/filtering";
import { getTemplateMetrics } from "../shared/metrics";
import { Heading, SemanticContactListView, SemanticHeaderView, SemanticRegionView, Text } from "../shared/primitives";
import { createRtlStyleHelpers } from "../shared/rtl";
import { Section } from "../shared/sections";
import { composeStyles, headerNameLineHeight } from "../shared/styles";

type TreeckoStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerName: Style;
	headerHeadline: Style;
	contactList: Style;
	contactItem: Style;
	profileContactItem: Style;
	sections: Style;
};

type TreeckoTemplate = {
	colors: TemplateColorRoles;
	styles: TreeckoStyles;
};

type TreeckoHeaderProps = {
	styles: TreeckoStyles;
};

export function getTreeckoSectionIds(main: string[], sidebar: string[]): string[] {
	return [...new Set([...main, ...sidebar])].filter((section) => section !== "summary" && section !== "profiles");
}

const normalizeProfileUrl = (url: string): string => url.trim().replace(/\/+$/, "").toLocaleLowerCase();

export function getTreeckoHeaderProfiles(items: ProfileItem[], primaryWebsiteUrl: string): ProfileItem[] {
	const primaryWebsite = normalizeProfileUrl(primaryWebsiteUrl);

	return items.filter((item) => {
		const profileUrl = normalizeProfileUrl(item.website.url);
		return !item.hidden && Boolean(profileUrl) && profileUrl !== primaryWebsite;
	});
}

export function getTreeckoProfileDisplayText(item: ProfileItem): string {
	return item.website.url
		.trim()
		.replace(/^https?:\/\//i, "")
		.replace(/\/+$/, "");
}

export const TreeckoPage = ({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) => {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { metadata } = data;
	const { colors, styles } = useTreeckoTemplate();
	const metrics = getTemplateMetrics(metadata.page);
	const sections = useRenderedSectionIds(
		pageNodeKey,
		filterSections(getTreeckoSectionIds(page.main, page.sidebar), data),
	);

	return (
		<Page
			{...semanticPageProps}
			size={semanticPageSize ?? pageSize}
			style={composeStyles(styles.page, pageMinHeightStyle, semanticPageStyle)}
		>
			<TemplateProvider pageNodeKey={pageNodeKey} styles={styles} colors={colors}>
				{showHeader && <Header styles={styles} />}

				<SemanticRegionView region="main" style={composeStyles(styles.sections, { rowGap: metrics.sectionGap })}>
					{sections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</SemanticRegionView>
			</TemplateProvider>
		</Page>
	);
};

const Header = ({ styles }: TreeckoHeaderProps) => {
	const { basics, sections } = useRender();
	const profiles = sections.profiles.hidden
		? []
		: getTreeckoHeaderProfiles(sections.profiles.items, basics.website.url);
	const website = basics.website.label.trim() ? basics.website : { ...basics.website, label: "Website" };

	return (
		<SemanticHeaderView style={styles.header}>
			<Heading style={styles.headerName}>{basics.name}</Heading>

			<SemanticContactListView style={styles.contactList}>
				<EmailContactItem email={basics.email} style={styles.contactItem} />
				<PhoneContactItem phone={basics.phone} style={styles.contactItem} />
				<LocationContactItem location={basics.location} style={styles.contactItem} />
				{basics.customFields.map((field) => (
					<CustomFieldContactItem key={field.id} field={field} style={styles.contactItem} />
				))}
				{profiles.map((profile) => (
					<ProfileContactItem
						key={profile.id}
						profile={profile}
						displayText={getTreeckoProfileDisplayText(profile)}
						style={styles.profileContactItem}
					/>
				))}
				<WebsiteContactItem website={website} style={styles.profileContactItem} />
			</SemanticContactListView>

			{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}
			<Section section="summary" placement="main" showHeading={false} />
		</SemanticHeaderView>
	);
};

const useTreeckoTemplate = (): TreeckoTemplate => {
	const { picture, metadata, rtl } = useRender();

	return useMemo(() => {
		const r = createRtlStyleHelpers(rtl);
		const foreground = rgbaStringToHex(metadata.design.colors.text);
		const background = rgbaStringToHex(metadata.design.colors.background);
		const primary = rgbaStringToHex(metadata.design.colors.primary);
		const colors: TemplateColorRoles = { foreground, background, primary };
		const metrics = getTemplateMetrics(metadata.page);
		const base = createBaseTemplateStyles({ metadata, foreground, background, r, metrics, picture });

		const baseStyles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.page.paddingVertical,
				rowGap: metrics.sectionGap,
			},
			heading: {
				...base.heading,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "600",
			},
			section: {
				flexDirection: "column",
				rowGap: metrics.gapY(0.25),
			},
			sectionHeading: {
				color: primary,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "600",
				textAlign: r.sectionHeadingTextAlign,
			},
			sectionItems: {
				rowGap: metrics.itemGapY,
			},
			item: {
				rowGap: metrics.gapY(0.125),
			},
			levelContainer: {
				width: "100%",
			},
			levelItem: {
				borderColor: primary,
			},
			levelItemActive: {
				backgroundColor: primary,
			},
			header: {
				...r.headerIdentity,
				rowGap: metrics.gapY(0.4),
			},
			headerName: {
				color: primary,
				fontSize: metadata.typography.heading.fontSize * 2,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "600",
				lineHeight: headerNameLineHeight,
			},
			headerHeadline: {
				fontFamily: metadata.typography.heading.fontFamily,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "600",
			},
			contactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				rowGap: metrics.gapY(0.25),
				columnGap: metrics.gapX(0.5),
				marginTop: metrics.gapY(0.15),
			},
			contactItem: {
				width: "31%",
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1 / 6),
			},
			profileContactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1 / 6),
			},
			sections: {
				flexDirection: "column",
			},
		});

		const accentFor = ({ colors }: TemplateStyleContext) => colors.primary;

		return {
			colors,
			styles: {
				...baseStyles,
				sectionHeading: (context) => ({ ...baseStyles.sectionHeading, color: accentFor(context) }),
				levelItem: (context) => ({ borderColor: accentFor(context) }),
				levelItemActive: (context) => ({ backgroundColor: accentFor(context) }),
				icon: (context) => ({
					display: metadata.page.hideIcons ? "none" : "flex",
					size: metadata.typography.body.fontSize,
					color: accentFor(context),
				}),
			} satisfies TreeckoStyles,
		};
	}, [picture, metadata, rtl]);
};
