import type { ReactNode } from "react";
import type { LeftSidebarSection } from "@/libs/resume/section";
import {
	ArrowLeftIcon,
	DotsSixVerticalIcon,
	DotsThreeIcon,
	MagicWandIcon,
	PencilSimpleIcon,
	PlusIcon,
	TrashSimpleIcon,
} from "@phosphor-icons/react";
import { Reorder, useDragControls } from "motion/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@reactive-resume/ui/components/dropdown-menu";
import { useCurrentBuilderResumeSelector, useUpdateResumeData } from "@/features/resume/builder/draft";
import { useConfirm } from "@/hooks/use-confirm";
import { usePrompt } from "@/hooks/use-prompt";
import { getSectionIcon, getSectionTitle } from "@/libs/resume/section";
import { BuilderSectionEditor } from "../-sidebar/left";

type WoboContentPanelProps = {
	focusedSection: LeftSidebarSection | null;
	onFocusedSectionChange: (section: LeftSidebarSection | null) => void;
};

type RowSection =
	| "basics"
	| "experience"
	| "education"
	| "skills"
	| "projects"
	| "volunteer"
	| "certifications"
	| "publications"
	| "awards";

type ContentRow = {
	section: RowSection;
	label: string;
	unit?: string;
	ai?: boolean;
};

type DraggableContentRow = ContentRow & {
	section: Exclude<RowSection, "basics">;
};

type LayoutPage = {
	fullWidth: boolean;
	main: string[];
	sidebar: string[];
};

const ROWS: ContentRow[] = [
	{ section: "basics", label: "Personal Information", ai: true },
	{ section: "experience", label: "Work Experience", unit: "role", ai: true },
	{ section: "education", label: "Education", unit: "entry", ai: true },
	{ section: "skills", label: "Skills", unit: "skill", ai: true },
	{ section: "projects", label: "Projects", unit: "project", ai: true },
	{ section: "volunteer", label: "Volunteer Experience", unit: "entry", ai: true },
	{ section: "certifications", label: "Certifications", unit: "certification" },
	{ section: "publications", label: "Publications", unit: "publication" },
	{ section: "awards", label: "Awards", unit: "award" },
];

const BASIC_ROW = ROWS[0] as ContentRow;
const DRAGGABLE_ROWS = ROWS.slice(1) as DraggableContentRow[];

export function applyContentSectionOrder(pages: LayoutPage[], orderedIds: string[]): LayoutPage[] {
	const layoutIds = new Set(pages.flatMap((page) => [...page.main, ...page.sidebar]));
	const orderedLayoutIds = orderedIds.filter((id) => layoutIds.has(id));
	const reorderableIds = new Set(orderedLayoutIds);
	let nextIndex = 0;

	const replaceSectionIds = (ids: string[]) =>
		ids.map((id) => {
			if (!reorderableIds.has(id)) return id;
			const nextId = orderedLayoutIds[nextIndex];
			nextIndex += 1;
			return nextId ?? id;
		});

	return pages.map((page) => ({
		...page,
		main: replaceSectionIds(page.main),
		sidebar: replaceSectionIds(page.sidebar),
	}));
}

type SortableSectionRowProps = {
	id: string;
	label: string;
	children: ReactNode;
};

function SortableSectionRow({ id, label, children }: SortableSectionRowProps) {
	const controls = useDragControls();

	return (
		<Reorder.Item
			value={id}
			dragListener={false}
			dragControls={controls}
			className="flex h-[52px] select-none items-center rounded-md border border-[#dedce3] bg-white px-2.5 shadow-[0_1px_1px_rgba(31,31,50,0.02)]"
			whileDrag={{ scale: 1.015, boxShadow: "0 12px 28px rgba(31, 31, 50, 0.14)", zIndex: 20 }}
		>
			<button
				type="button"
				aria-label={`Drag ${label}`}
				onPointerDown={(event) => controls.start(event)}
				className="me-2.5 flex size-4 shrink-0 cursor-grab touch-none items-center justify-center text-[#8d8a9a] active:cursor-grabbing"
			>
				<DotsSixVerticalIcon className="size-4" weight="bold" />
			</button>
			{children}
		</Reorder.Item>
	);
}

type BuiltInRowContentProps = {
	row: ContentRow;
	count: number;
	onEdit: () => void;
	options?: ReactNode;
};

function BuiltInRowContent({ row, count, onEdit, options }: BuiltInRowContentProps) {
	const { section, label, unit, ai } = row;
	const empty = count === 0;
	const countLabel = unit ? `${count} ${unit}${count === 1 ? "" : "s"}` : null;

	return (
		<>
			<button
				type="button"
				aria-label={`Edit ${label}`}
				onClick={onEdit}
				className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
			>
				<span className="text-[#a3a0ad]">{getSectionIcon(section, { className: "size-4" })}</span>
				<span className="truncate font-medium text-sm">{label}</span>
			</button>

			{countLabel && !empty && (
				<span className="me-1.5 rounded-full border border-[#dedce3] px-2.5 py-0.5 text-[#747386] text-[10px]">
					{countLabel}
				</span>
			)}
			<span
				className={
					empty
						? "me-1.5 rounded-full border border-[#e3e0df] px-2.5 py-0.5 text-[#aaa7b1] text-[10px] italic"
						: "me-1.5 rounded-full border border-[#a9efc7] bg-[#f0fff6] px-2.5 py-0.5 font-medium text-[#159a5c] text-[10px]"
				}
			>
				{empty ? "Optional · empty" : "● All good"}
			</span>
			{ai && (
				<button
					type="button"
					aria-label={`AI suggestions for ${label}`}
					className="me-0.5 flex size-8 items-center justify-center rounded-full border border-[#c9c1ff] text-[#6255e7]"
				>
					<MagicWandIcon className="size-4" />
				</button>
			)}
			{options}
		</>
	);
}

type SectionOptionsMenuProps = {
	label: string;
	section?: Exclude<RowSection, "basics">;
	customSectionId?: string;
	currentTitle: string;
};

function SectionOptionsMenu({ label, section, customSectionId, currentTitle }: SectionOptionsMenuProps) {
	const prompt = usePrompt();
	const confirm = useConfirm();
	const updateResumeData = useUpdateResumeData();

	const handleRename = async () => {
		const nextTitle = await prompt("Rename section", {
			description: "Enter a new section name. Leave empty to restore the default title.",
			defaultValue: currentTitle,
			confirmText: "Rename",
		});
		if (nextTitle === null || nextTitle === currentTitle) return;

		updateResumeData((draft) => {
			if (section) draft.sections[section].title = nextTitle;
			if (customSectionId) {
				const customSection = draft.customSections.find((item) => item.id === customSectionId);
				if (customSection) customSection.title = nextTitle;
			}
		});
	};

	const handleRemove = async () => {
		const confirmed = await confirm(`Remove ${label}?`, {
			description: "This section will be removed from the resume layout.",
			confirmText: "Remove section",
		});
		if (!confirmed) return;

		updateResumeData((draft) => {
			for (const page of draft.metadata.layout.pages) {
				page.main = page.main.filter((id) => id !== section && id !== customSectionId);
				page.sidebar = page.sidebar.filter((id) => id !== section && id !== customSectionId);
			}

			if (section) draft.sections[section].hidden = true;
			if (customSectionId) {
				draft.customSections = draft.customSections.filter((item) => item.id !== customSectionId);
			}
		});
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={`${label} options`}
				className="flex size-7 items-center justify-center rounded-md text-[#9996a4] hover:bg-[#f5f2f0]"
			>
				<DotsThreeIcon weight="bold" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-52 rounded-md p-2 shadow-xl">
				<DropdownMenuItem className="h-11 gap-3 rounded-md px-3 text-sm" onClick={() => void handleRename()}>
					<PencilSimpleIcon className="size-5" />
					Rename section
				</DropdownMenuItem>
				<DropdownMenuSeparator className="my-2" />
				<DropdownMenuItem
					className="h-11 gap-3 rounded-md bg-red-50 px-3 text-red-600 text-sm focus:bg-red-100 focus:text-red-600 dark:bg-red-950/30 dark:text-red-400 dark:focus:bg-red-950/50 dark:focus:text-red-300 [&_svg]:text-current"
					onClick={() => void handleRemove()}
				>
					<TrashSimpleIcon className="size-5" />
					Remove section
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function WoboContentPanel({ focusedSection, onFocusedSectionChange }: WoboContentPanelProps) {
	const data = useCurrentBuilderResumeSelector((resume) => resume.data);
	const updateResumeData = useUpdateResumeData();

	if (focusedSection) {
		return (
			<div className="h-full overflow-y-auto bg-[#fbf8f4] px-6 py-7 text-[#242337]">
				<div className="mb-7 flex items-center gap-4">
					<button
						type="button"
						aria-label="Back to sections"
						onClick={() => onFocusedSectionChange(null)}
						className="flex size-10 items-center justify-center rounded-md border border-[#dedce3] bg-white text-[#6255e7]"
					>
						<ArrowLeftIcon />
					</button>
					<h1 className="font-semibold text-2xl">{getSectionTitle(focusedSection)}</h1>
					<button
						type="button"
						aria-label={`AI suggestions for ${getSectionTitle(focusedSection)}`}
						className="ms-auto flex size-10 items-center justify-center rounded-full border border-[#c9c1ff] text-[#6255e7]"
					>
						<MagicWandIcon />
					</button>
				</div>
				<BuilderSectionEditor section={focusedSection} />
			</div>
		);
	}

	const draggableIds = [
		...DRAGGABLE_ROWS.filter((row) => !data.sections[row.section].hidden).map((row) => row.section),
		...data.customSections.map((section) => section.id),
	];
	const draggableIdSet = new Set(draggableIds);
	const layoutOrder = data.metadata.layout.pages.flatMap((page) => [...page.main, ...page.sidebar]);
	const orderedIds = [...new Set([...layoutOrder.filter((id) => draggableIdSet.has(id)), ...draggableIds])];

	const handleReorder = (nextOrder: string[]) => {
		updateResumeData((draft) => {
			draft.metadata.layout.pages = applyContentSectionOrder(draft.metadata.layout.pages, nextOrder);
		});
	};

	return (
		<section className="h-full overflow-y-auto bg-[#fbf8f4] p-5 text-[#242337]">
			<div className="space-y-2">
				<div className="flex h-[52px] items-center rounded-md border border-[#dedce3] bg-white px-2.5 shadow-[0_1px_1px_rgba(31,31,50,0.02)]">
					<span aria-hidden="true" className="me-2.5 size-4 shrink-0" />
					<BuiltInRowContent row={BASIC_ROW} count={1} onEdit={() => onFocusedSectionChange("basics")} />
				</div>

				<Reorder.Group axis="y" values={orderedIds} onReorder={handleReorder} className="space-y-2">
					{orderedIds.map((id) => {
						const row = DRAGGABLE_ROWS.find((candidate) => candidate.section === id);
						if (row) {
							const count = data.sections[row.section].items.length;
							return (
								<SortableSectionRow key={id} id={id} label={row.label}>
									<BuiltInRowContent
										row={row}
										count={count}
										onEdit={() => onFocusedSectionChange(row.section)}
										options={
											<SectionOptionsMenu
												label={row.label}
												section={row.section}
												currentTitle={data.sections[row.section].title || row.label}
											/>
										}
									/>
								</SortableSectionRow>
							);
						}

						const customSection = data.customSections.find((section) => section.id === id);
						if (!customSection) return null;

						return (
							<SortableSectionRow key={id} id={id} label={customSection.title}>
								<button
									type="button"
									onClick={() => onFocusedSectionChange("custom")}
									className="min-w-0 flex-1 truncate text-left font-medium"
								>
									{customSection.title}
								</button>
								<span className="me-1.5 rounded-full border border-[#a9efc7] bg-[#f0fff6] px-2.5 py-0.5 font-medium text-[#159a5c] text-[10px]">
									● All good
								</span>
								<SectionOptionsMenu
									label={customSection.title}
									customSectionId={customSection.id}
									currentTitle={customSection.title}
								/>
							</SortableSectionRow>
						);
					})}
				</Reorder.Group>

				<button
					type="button"
					className="flex h-11 w-full items-center gap-2.5 rounded-md border border-[#dcd8d4] border-dashed px-3 text-[#747386] text-sm"
				>
					<PlusIcon /> Add Section
				</button>
			</div>
		</section>
	);
}
