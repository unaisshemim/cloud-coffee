import z from "zod";

export const templateSchema = z.enum(["classic", "treecko"]);

export type Template = z.infer<typeof templateSchema>;
