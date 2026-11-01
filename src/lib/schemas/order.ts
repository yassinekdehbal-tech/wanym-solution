import { z } from "zod";

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => trimmed(max).optional().or(z.literal(""));

/**
 * What the order form collects. The fields mirror NAMY's vendor form so the
 * same pricing engine applies: parcels, total weight, heaviest parcel,
 * longest side, delivery mode, options, floor, date + account time slot.
 */
export const quoteInputSchema = z.object({
  service_slug: optionalText(80),
  pickup_address: trimmed(300).min(5, "Adresse d'enlèvement requise"),
  pickup_contact: optionalText(120),
  pickup_phone: optionalText(30),
  delivery_address: trimmed(300).min(5, "Adresse de livraison requise"),
  delivery_contact: optionalText(120),
  delivery_phone: optionalText(30),
  delivery_email: z.string().trim().toLowerCase().email("E-mail de livraison invalide").max(200).optional().or(z.literal("")),
  delivery_instructions: optionalText(500),
  wanted_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  creneau: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Créneau invalide").optional().or(z.literal("")),
  mode_id: optionalText(60),
  nb_colis: z.coerce.number().int().min(1, "Au moins 1 colis").max(999).default(1),
  poids_total_kg: z.coerce.number().positive("Poids total requis").max(50000),
  poids_max_colis_kg: z.coerce.number().positive().max(5000).optional().or(z.literal("")),
  nb_colis_lourds: z.coerce.number().int().min(0).max(999).default(0),
  longueur_max_cm: z.coerce.number().positive("Plus grande longueur requise").max(2000),
  etage: z.coerce.number().int().min(0).max(60).default(0),
  acces_escalier: z.coerce.boolean().default(false),
  options: z.array(z.string().max(60)).max(20).default([]),
});

export const orderInputSchema = quoteInputSchema.extend({
  creneau: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Choisissez un créneau"),
  goods_type: trimmed(200).min(2, "Décrivez la marchandise"),
  notes: optionalText(2000),
  company: optionalText(160),
  contact_name: trimmed(120).min(2, "Votre nom est requis"),
  email: z.string().trim().toLowerCase().email("E-mail invalide").max(200),
  phone: z.string().trim().regex(/^(\+?\d[\d\s.-]{7,18})$/, "Téléphone invalide"),
  accept_terms: z.literal(true, { error: "Vous devez accepter les CGV" }),
  gclid: optionalText(200),
  utm: z.record(z.string(), z.string().max(200)).optional(),
  website: z.string().max(0).optional(), // honeypot
});

export type QuoteInput = z.infer<typeof quoteInputSchema>;
export type OrderInput = z.infer<typeof orderInputSchema>;

/** Admin-side updates: PATCH /api/orders/[id]. */
export const orderPatchSchema = z
  .object({
    status: z.enum(["new", "quoted", "confirmed", "in_progress", "delivered", "cancelled", "sav"]).optional(),
    payment_status: z.enum(["not_required", "pending", "authorized", "paid", "failed", "refunded"]).optional(),
    price_cents: z.number().int().min(0).nullable().optional(),
    total_cents: z.number().int().min(0).nullable().optional(),
    wanted_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    wanted_slot: z.string().max(20).nullable().optional(),
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
