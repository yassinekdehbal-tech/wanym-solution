export type Service = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  icon: string | null;
  sort_order: number;
  published: boolean;
  updated_at: string;
};

export type SiteContent = Record<string, string>;

export type PricingRule = {
  service_slug: string;
  label: string;
  instant_booking: boolean;
  base_cents: number;
  per_km_cents: number;
  per_unit_cents: number;
  min_cents: number;
  max_km: number | null;
  max_units: number | null;
  vat_rate: number;
  surcharges: { handling?: number; floor?: number; urgent_pct?: number };
  active: boolean;
  updated_at: string;
};

export const ORDER_STATUSES = [
  "new",
  "quoted",
  "confirmed",
  "in_progress",
  "delivered",
  "cancelled",
  "sav",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["not_required", "pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const EVENT_TYPES = ["created", "payment", "status", "note", "sav", "invoice", "namy", "email"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type Order = {
  id: string;
  reference: string;
  created_at: string;
  updated_at: string;
  status: OrderStatus;
  service_slug: string | null;
  pickup_address: string;
  pickup_postal_code: string | null;
  pickup_contact: string | null;
  delivery_address: string;
  delivery_postal_code: string | null;
  delivery_contact: string | null;
  goods_type: string | null;
  quantity: string | null;
  quantity_unit: string | null;
  dimensions: string | null;
  weight_kg: number | null;
  wanted_date: string | null;
  wanted_slot: string | null;
  options: Record<string, boolean>;
  company: string | null;
  contact_name: string;
  email: string;
  phone: string;
  notes: string | null;
  source: string | null;
  gclid: string | null;
  utm: Record<string, string> | null;
  distance_km: number | null;
  pricing_mode: "instant" | "quote";
  price_cents: number | null;
  vat_rate: number;
  total_cents: number | null;
  currency: string;
  payment_status: PaymentStatus;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  paid_at: string | null;
  namy_ref: string | null;
  namy_synced_at: string | null;
  invoice_number: string | null;
  invoice_url: string | null;
  invoiced_at: string | null;
};

export type OrderEvent = {
  id: string;
  order_id: string;
  created_at: string;
  type: EventType;
  message: string | null;
  data: Record<string, unknown> | null;
  author: string;
  public: boolean;
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Reçue",
  quoted: "Devis envoyé",
  confirmed: "Confirmée",
  in_progress: "En cours de livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
  sav: "SAV en cours",
};
