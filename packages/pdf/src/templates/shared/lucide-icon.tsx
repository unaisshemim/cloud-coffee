import type { Style } from "@react-pdf/types";
import { Circle, Line, Path, Rect, Svg } from "#react-pdf-renderer";

export type LucideIconName = "globe" | "link" | "mail" | "map-pin" | "phone";

type LucideIconProps = {
	name: LucideIconName;
	size?: number | string | undefined;
	color?: string | undefined;
	style?: Style | Style[] | undefined;
};

export const LucideIcon = ({ name, size = 12, color = "#18181b", style }: LucideIconProps) => {
	const strokeProps = {
		fill: "none",
		stroke: color,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
		strokeWidth: 1.8,
	};

	return (
		<Svg viewBox="0 0 24 24" width={size} height={size} {...(style ? { style } : {})}>
			{name === "mail" && (
				<>
					<Rect x={2} y={4} width={20} height={16} rx={2} {...strokeProps} />
					<Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" {...strokeProps} />
				</>
			)}
			{name === "phone" && (
				<Path
					d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.56 2.81.69A2 2 0 0 1 22 16.92Z"
					{...strokeProps}
				/>
			)}
			{name === "map-pin" && (
				<>
					<Path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" {...strokeProps} />
					<Circle cx={12} cy={10} r={3} {...strokeProps} />
				</>
			)}
			{name === "globe" && (
				<>
					<Circle cx={12} cy={12} r={10} {...strokeProps} />
					<Path d="M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" {...strokeProps} />
					<Line x1={2} x2={22} y1={12} y2={12} {...strokeProps} />
				</>
			)}
			{name === "link" && (
				<>
					<Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" {...strokeProps} />
					<Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" {...strokeProps} />
				</>
			)}
		</Svg>
	);
};
