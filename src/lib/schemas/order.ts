import { z } from "zod";

const trimmed = (max: number) => z.string().trim().max(max);

export const SLOTS = ["morning", "afternoon", "day", "urgent"] as const;
export const SLOT_LABELS: Record<(typeof SLOTS)[number], string> = {
  morning: "Matin (8h–12h)",
  afternoon: "Après-midi (12h–18h)",
  day: "Journée (8h–18h)",
  urgent: "Urgent — dès que possible",
};

export const UNITS = ["colis", "palette", "autre"] as const;

export const optionsSchema = z.object({
  handling: z.boolean().default(false), // manutention / hayon
  floor: z.boolean().default(false), // livraison à l'étage
  fragile: z.boolean().default(false),
});

/** Payload accepted by POST /api/quote (price estimate, nothing stored). */
export const quoteInputSchema = z.object({
  service_slug: trimmed(80).min(1, "Choisissez un type de transport"),
  pickup_address: trimmed(300).min(5, "Adresse de départ requise"),
  delivery_address: trimmed(300).min(5, "Adresse d'arrivée requise"),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
  quantity_unit: z.enum(UNITS).default("colis"),
  wanted_slot: z.enum(SLOTS).default("day"),
  options: optionsSchema.default({ handling: false, floor: false, fragile: false }),
});

/** Payload accepted by POST /api/orders. */
export const orderInputSchema = quoteInputSchema.extend({
  pickup_contact: trimmed(120).optional().or(z.literal("")),
  delivery_contact: trimmed(120).optional().or(z.literal("")),
  goods_type: trimmed(200).min(2, "Décrivez la marchandise"),
  dimensions: trimmed(120).optional().or(z.literal("")),
  weight_kg: z.coerce.number().min(0).max(100000).optional().or(z.literal("")),
  wanted_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
    .refine((d) => new Date(d).getTime() >= Date.now() - 86_400_000, "La date est passée"),
  company: trimmed(160).optional().or(z.literal("")),
  contact_name: trimmed(120).min(2, "Votre nom est requis"),
  email: z.string().trim().toLowerCase().email("E-mail invalide").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?\d[\d\s.-]{7,18})$/, "Téléphone invalide"),
  notes: trimmed(2000).optional().or(z.literal("")),
  accept_terms: z.literal(true, { error: "Vous devez accepter les CGV" }),
  // attribution
  gclid: trimmed(200).optional().or(z.literal("")),
  utm: z.record(z.string(), z.string().max(200)).optional(),
  // honeypot: must stay empty
  website: z.string().max(0).optional(),
});

export type QuoteInput = z.infer<typeof quoteInputSchema>;
export type OrderInput = z.infer<typeof orderInputSchema>;

/** Admin-side updates: PATCH /api/orders/[id]. */
export const orderPatchSchema = z
  .object({
    status: z.enum(["new", "quoted", "confirmed", "in_progress", "delivered", "cancelled", "sav"]).optional(),
    payment_status: z.enum(["not_required", "pending", "paid", "failed", "refunded"]).optional(),
    price_cents: z.number().int().min(0).nullable().optional(),
    total_cents: z.number().int().min(0).nullable().optional(),
    wanted_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    wanted_slot: z.enum(SLOTS).nullable().optional(),
    namy_ref: trimmed(120).nullable().optional(),
    invoice_number: trimmed(80).nullable().optional(),
    invoice_url: z.string().url().max(500).nullable().optional(),
    notes: trimmed(4000).nullable().optional(),
    /** Free-text message logged as an event; e-mailed to the customer when notify_customer is true. */
    message: trimmed(2000).optional(),
    notify_customer: z.boolean().default(false),
    author: trimmed(80).default("api"),
  })
  .strict();

export const orderEventInputSchema = z
  .object({
    type: z.enum(["note", "sav", "invoice", "status", "namy", "payment"]).default("note"),
    message: trimmed(2000).min(1),
    data: z.record(z.string(), z.unknown()).optional(),
    public: z.boolean().default(false),
    author: trimmed(80).default("api"),
    notify_customer: z.boolean().default(false),
  })
  .strict();

export const trackInputSchema = z.object({
  reference: z.string().trim().toUpperCase().regex(/^WS-\d{4}-\d{5}$/, "Référence invalide (format WS-2026-00001)"),
  email: z.string().trim().toLowerCase().email(),
});
