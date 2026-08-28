import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { Input } from "@reactive-resume/ui/components/input";
import { Label } from "@reactive-resume/ui/components/label";
import { Textarea } from "@reactive-resume/ui/components/textarea";
import { cn } from "@reactive-resume/utils/style";

type FieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	type?: React.HTMLInputTypeAttribute;
	className?: string;
};

export function ProfileField({ label, value, onChange, placeholder, type = "text", className }: FieldProps) {
	return (
		<div className={cn("grid gap-1.5", className)}>
			<Label className="font-medium text-[13px]">{label}</Label>
			<Input
				type={type}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className="h-10 rounded-md bg-white px-3"
			/>
		</div>
	);
}

type TextareaFieldProps = Omit<FieldProps, "type">;

export function ProfileTextarea({ label, value, onChange, placeholder, className }: TextareaFieldProps) {
	return (
		<div className={cn("grid gap-1.5", className)}>
			<Label className="font-medium text-[13px]">{label}</Label>
			<Textarea
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className="min-h-24 resize-y rounded-md bg-white px-3 py-2"
			/>
		</div>
	);
}

type TagEditorProps = {
	label: string;
	values: string[];
	onChange: (values: string[]) => void;
	placeholder: string;
};

export function TagEditor({ label, values, onChange, placeholder }: TagEditorProps) {
	const [draft, setDraft] = useState("");

	const add = () => {
		const next = draft.trim();
		if (!next || values.includes(next)) return;
		onChange([...values, next]);
		setDraft("");
	};

	return (
		<div className="grid gap-1.5">
			<Label className="font-medium text-[13px]">{label}</Label>
			<div className="flex min-h-12 flex-wrap items-center gap-2 rounded-md border border-input bg-white p-2">
				{values.map((value) => (
					<span key={value} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-sm">
						{value}
						<button
							type="button"
							aria-label={`Remove ${value}`}
							className="text-muted-foreground hover:text-foreground"
							onClick={() => onChange(values.filter((item) => item !== value))}
						>
							<XIcon className="size-3.5" />
						</button>
					</span>
				))}
				<input
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					onBlur={add}
					onKeyDown={(event) => {
						if (event.key !== "Enter" && event.key !== ",") return;
						event.preventDefault();
						add();
					}}
					placeholder={placeholder}
					className="h-8 min-w-48 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
				/>
			</div>
		</div>
	);
}

type BooleanChoiceProps = {
	label: string;
	value: boolean | null;
	onChange: (value: boolean) => void;
};

export function BooleanChoice({ label, value, onChange }: BooleanChoiceProps) {
	return (
		<div className="flex min-h-12 items-center justify-between gap-4 rounded-md border border-input bg-white px-4 py-2">
			<span className="font-medium text-sm">{label}</span>
			<div className="flex gap-2">
				{[
					{ label: "Yes", value: true },
					{ label: "No", value: false },
				].map((option) => (
					<Button
						key={option.label}
						type="button"
						size="sm"
						variant={value === option.value ? "default" : "outline"}
						className="rounded-full px-4"
						onClick={() => onChange(option.value)}
					>
						{option.label}
					</Button>
				))}
			</div>
		</div>
	);
}

type EmptyPanelProps = {
	title: string;
	description: string;
	action: string;
	onAdd: () => void;
	icon: React.ReactNode;
};

export function EmptyPanel({ title, description, action, onAdd, icon }: EmptyPanelProps) {
	return (
		<div className="grid min-h-56 place-items-center rounded-md border border-dashed bg-white p-8 text-center">
			<div className="grid max-w-sm justify-items-center gap-3">
				<div className="grid size-12 place-items-center rounded-md bg-muted text-muted-foreground">{icon}</div>
				<h3 className="font-semibold text-base">{title}</h3>
				<p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
				<Button
					type="button"
					variant="outline"
					className="rounded-full border-violet-300 text-violet-700"
					onClick={onAdd}
				>
					<PlusIcon />
					{action}
				</Button>
			</div>
		</div>
	);
}
