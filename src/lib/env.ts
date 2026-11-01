export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://wanymsolution.com",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "WANYM SOLUTION <commandes@wanymsolution.com>",
  ordersNotifyEmail: process.env.ORDERS_NOTIFY_EMAIL ?? "",
  contentApiKey: process.env.CONTENT_API_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // Stripe Tax. Off by default: the TTC computed by NAMY (TVA 20 %) is charged as is. Turn on ONLY once the
  // head-office address and the FR registration are active in Stripe → Tax, otherwise Stripe collects 0 tax.
  stripeAutomaticTax: process.env.STRIPE_AUTOMATIC_TAX === "1",
  // Product tax code for transport services, picked from https://docs.stripe.com/tax/tax-codes (account preset when empty).
  stripeTaxCode: process.env.STRIPE_TAX_CODE ?? "",
  stripeInvoiceDaysDue: Number(process.env.STRIPE_INVOICE_DAYS_DUE ?? 30) || 30,
  namyWebhookUrl: process.env.NAMY_WEBHOOK_URL ?? "",
  namyApiKey: process.env.NAMY_API_KEY ?? "",
  // Key NAMY presents on POST /api/webhooks/namy (vault secret wanym_site_api_key). Falls back to CONTENT_API_KEY.
  namyInboundKey: process.env.NAMY_INBOUND_KEY || process.env.CONTENT_API_KEY || "",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  gtagId: process.env.NEXT_PUBLIC_GTAG_ID ?? "",
  gtagConversionLabel: process.env.NEXT_PUBLIC_GTAG_CONVERSION_LABEL ?? "",
};
