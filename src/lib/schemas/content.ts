import { z } from "zod";

export const contentValueSchema = z.object({ value: z.string().max(20000) });
export const contentBulkSchema = z.record(z.string().min(1).max(120), z.string().max(20000));

export const serviceInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug: minuscules, chiffres et tirets"),
  title: z.string().trim().min(2).max(160),
  summary: z.string().max(600).nullable().optional(),
  body: z.string().max(50000).nullable().optional(),
  icon: z.string().max(40).nullable().optional(),
  sort_order: z.number().int().default(0),
  published: z.boolean().default(true),
});
export const servicePatchSchema = serviceInputSchema.partial().omit({ slug: true }).extend({
  slug: serviceInputSchema.shape.slug.optional(),
});
