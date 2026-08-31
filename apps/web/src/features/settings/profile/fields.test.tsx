// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileField, ProfileTextarea, TagEditor } from "./fields";

describe("profile fields", () => {
	it("associates each visible label with its exact form control", () => {
		render(
			<>
				<ProfileField label="Application email" type="email" value="" onChange={vi.fn()} />
				<ProfileField label="Phone" type="tel" value="" onChange={vi.fn()} />
				<ProfileTextarea label="Career summary" value="" onChange={vi.fn()} />
				<TagEditor label="Skills" values={[]} onChange={vi.fn()} placeholder="Add a skill..." />
			</>,
		);

		expect(screen.getByLabelText("Application email")).toHaveAttribute("type", "email");
		expect(screen.getByLabelText("Phone")).toHaveAttribute("type", "tel");
		expect(screen.getByLabelText("Career summary").tagName).toBe("TEXTAREA");
		expect(screen.getByLabelText("Skills")).toHaveAttribute("placeholder", "Add a skill...");
	});

	it("keeps repeated field labels associated with unique controls", () => {
		render(
			<>
				<ProfileField label="Title" value="First" onChange={vi.fn()} />
				<ProfileField label="Title" value="Second" onChange={vi.fn()} />
			</>,
		);

		const controls = screen.getAllByLabelText("Title");
		expect(controls).toHaveLength(2);
		expect(controls[0]).not.toHaveAttribute("id", controls[1]?.id);
	});
});
