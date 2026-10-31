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

export const pricingRuleSchema = z
  .object({
    label: z.string().trim().min(2).max(120),
    instant_booking: z.boolean(),
    base_cents: z.number().int().min(0),
    per_km_cents: z.number().int().min(0),
    per_unit_cents: z.number().int().min(0),
    min_cents: z.number().int().min(0),
    max_km: z.number().int().min(1).nullable(),
    max_units: z.number().int().min(1).nullable(),
    vat_rate: z.number().min(0).max(100),
    surcharges: z.object({
      handling: z.number().int().min(0).optional(),
      floor: z.number().int().min(0).optional(),
      urgent_pct: z.number().min(0).max(200).optional(),
    }),
    active: z.boolean(),
  })
  .partial();
