import { z } from "zod";
import {
	applicationProfileCandidateSchema,
	applicationProfileSchema,
} from "@reactive-resume/schema/application-profile";
import { protectedProcedure } from "../../context";
import { aiRequestRateLimit } from "../../middleware/rate-limit";
import { profileMergeOperationSchema } from "./merge";
import { applicationProfileService } from "./service";
import { createTargetedResume, targetedResumeInputSchema } from "./targeted-resume";

export const applicationProfileDocumentSchema = z.object({
	profile: applicationProfileSchema,
	revision: z.number().int().nonnegative(),
});
const profileMergePreviewSchema = applicationProfileDocumentSchema.extend({
	operations: z.array(profileMergeOperationSchema),
	summary: z.array(z.string()),
});

export const applicationProfileRouter = {
	get: protectedProcedure
		.route({
			method: "GET",
			path: "/application-profile",
			tags: ["Application Profile"],
			operationId: "getApplicationProfile",
			summary: "Get application profile",
			description: "Returns reusable job-application information for the authenticated user.",
		})
		.output(applicationProfileDocumentSchema)
		.handler(({ context }) => applicationProfileService.getDocument({ userId: context.user.id })),

	update: protectedProcedure
		.route({
			method: "PUT",
			path: "/application-profile",
			tags: ["Application Profile"],
			operationId: "updateApplicationProfile",
			summary: "Update application profile",
			description: "Replaces reusable job-application information for the authenticated user.",
		})
		.input(applicationProfileDocumentSchema)
		.output(applicationProfileDocumentSchema)
		.handler(({ context, input }) => applicationProfileService.update({ userId: context.user.id, ...input })),

	previewMerge: protectedProcedure
		.route({
			method: "POST",
			path: "/application-profile/merge/preview",
			tags: ["Application Profile"],
			operationId: "previewApplicationProfileMerge",
			summary: "Preview a career profile merge",
		})
		.input(z.object({ candidate: applicationProfileCandidateSchema }))
		.output(profileMergePreviewSchema)
		.handler(({ context, input }) =>
			applicationProfileService.previewMerge({ userId: context.user.id, candidate: input.candidate }),
		),

	applyMerge: protectedProcedure
		.route({
			method: "POST",
			path: "/application-profile/merge/apply",
			tags: ["Application Profile"],
			operationId: "applyApplicationProfileMerge",
			summary: "Apply an approved career profile merge",
		})
		.input(
			z.object({
				revision: z.number().int().nonnegative(),
				operations: z.array(profileMergeOperationSchema).max(50),
				confirm: z.literal(true),
			}),
		)
		.output(applicationProfileDocumentSchema)
		.handler(({ context, input }) => applicationProfileService.applyMerge({ userId: context.user.id, ...input })),

	createTargetedResume: protectedProcedure
		.route({
			method: "POST",
			path: "/application-profile/targeted-resume",
			tags: ["Application Profile", "AI"],
			operationId: "createTargetedResumeFromProfile",
			summary: "Create a targeted resume draft from the career profile",
		})
		.input(targetedResumeInputSchema)
		.use(aiRequestRateLimit)
		.output(z.object({ resumeId: z.string(), name: z.string(), builderUrl: z.string() }))
		.handler(({ context, input }) =>
			createTargetedResume({ userId: context.user.id, locale: context.locale, data: input }),
		),
};
