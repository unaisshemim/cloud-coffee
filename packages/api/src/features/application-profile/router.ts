import { applicationProfileSchema } from "@reactive-resume/schema/application-profile";
import { protectedProcedure } from "../../context";
import { applicationProfileService } from "./service";

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
		.output(applicationProfileSchema)
		.handler(({ context }) => applicationProfileService.get({ userId: context.user.id })),

	update: protectedProcedure
		.route({
			method: "PUT",
			path: "/application-profile",
			tags: ["Application Profile"],
			operationId: "updateApplicationProfile",
			summary: "Update application profile",
			description: "Replaces reusable job-application information for the authenticated user.",
		})
		.input(applicationProfileSchema)
		.output(applicationProfileSchema)
		.handler(({ context, input }) => applicationProfileService.update({ userId: context.user.id, data: input })),
};
