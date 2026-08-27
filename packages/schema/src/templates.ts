import z from "zod";

export const templateSchema = z.enum(["treecko"]);

export type Template = z.infer<typeof templateSchema>;
