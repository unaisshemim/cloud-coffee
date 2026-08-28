import type { Style } from "@react-pdf/types";
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
	WebsiteContactItem,
} from "../shared/contact-item";
import { TemplateProvider } from "../shared/context";
import { filterSections } from "../shared/filtering";
import { getTemplateMetrics } from "../shared/metrics";
import { Heading, SemanticContactListView, SemanticHeaderView, SemanticRegionView, Text } from "../shared/primitives";
import { createRtlStyleHelpers } from "../shared/rtl";
import { Section } from "../shared/sections";
import { composeStyles, headerNameLineHeight } from "../shared/styles";

type ClassicStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerName: Style;
	headerHeadline: Style;
	contactList: Style;
	contactItem: Style;
	sections: Style;
};

type ClassicTemplate = {
	colors: TemplateColorRoles;
	styles: ClassicStyles;
};

type ClassicHeaderProps = {
	styles: ClassicStyles;
};

export function getClassicSectionIds(main: string[], sidebar: string[]): string[] {
	return [...new Set([...main, ...sidebar])].filter((section) => section !== "summary");
}

export const ClassicPage = ({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) => {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { metadata } = data;
	const { colors, styles } = useClassicTemplate();
	const metrics = getTemplateMetrics(metadata.page);
	const sections = useRenderedSectionIds(
		pageNodeKey,
		filterSections(getClassicSectionIds(page.main, page.sidebar), data),
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

const Header = ({ styles }: ClassicHeaderProps) => {
	const { basics } = useRender();

	return (
		<SemanticHeaderView style={styles.header}>
			<Heading style={styles.headerName}>{basics.name}</Heading>
			{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}

			<SemanticContactListView style={styles.contactList}>
				<EmailContactItem email={basics.email} style={styles.contactItem} />
				<PhoneContactItem phone={basics.phone} style={styles.contactItem} />
				<LocationContactItem location={basics.location} style={styles.contactItem} />
				<WebsiteContactItem website={basics.website} style={styles.contactItem} />
				{basics.customFields.map((field) => (
					<CustomFieldContactItem key={field.id} field={field} style={styles.contactItem} />
				))}
			</SemanticContactListView>

			<Section section="summary" placement="main" showHeading={false} />
		</SemanticHeaderView>
	);
};

const useClassicTemplate = (): ClassicTemplate => {
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
				borderBottomColor: foreground,
				borderBottomWidth: 0.75,
				paddingBottom: metrics.gapY(0.125),
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
				borderColor: foreground,
			},
			levelItemActive: {
				backgroundColor: foreground,
			},
			header: {
				...r.headerIdentity,
				rowGap: metrics.gapY(0.25),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 1.8,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "600",
				lineHeight: headerNameLineHeight,
				textAlign: "center",
				width: "100%",
			},
			headerHeadline: {
				fontFamily: metadata.typography.heading.fontFamily,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "600",
				textAlign: "center",
				width: "100%",
			},
			contactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				justifyContent: "center",
				rowGap: metrics.gapY(0.2),
				columnGap: metrics.gapX(0.5),
				width: "100%",
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1 / 6),
			},
			sections: {
				flexDirection: "column",
			},
		});

		const foregroundFor = ({ colors }: TemplateStyleContext) => colors.foreground;

		return {
			colors,
			styles: {
				...baseStyles,
				sectionHeading: (context) => ({
					...baseStyles.sectionHeading,
					borderBottomColor: foregroundFor(context),
				}),
				levelItem: (context) => ({ borderColor: foregroundFor(context) }),
				levelItemActive: (context) => ({ backgroundColor: foregroundFor(context) }),
				icon: (context) => ({
					display: metadata.page.hideIcons ? "none" : "flex",
					size: metadata.typography.body.fontSize,
					color: foregroundFor(context),
				}),
			} satisfies ClassicStyles,
		};
	}, [picture, metadata, rtl]);
};
