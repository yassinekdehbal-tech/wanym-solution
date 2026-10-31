import { env } from "@/lib/env";
import type { Order } from "@/lib/types";

/**
 * Push an order to NAMY (the ops / TMS back-office). The order lands in NAMY's
 * public-orders channel (`commandes_publiques`): staff accepts it there, which
 * captures the Stripe pre-authorisation and creates the expedition. NAMY then
 * calls back POST /api/webhooks/namy on every state change.
 * Configured with NAMY_WEBHOOK_URL + NAMY_API_KEY. No-op when unset.
 */
export async function pushOrderToNamy(order: Order): Promise<{ ok: boolean; ref?: string; error?: string; skipped?: boolean }> {
  if (!env.namyWebhookUrl) return { ok: false, skipped: true };
  try {
    const res = await fetch(env.namyWebhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // NAMY route sur cet en-tête (Edge creer-commande-publique, clé WANYM_SITE_API_KEY).
        ...(env.namyApiKey ? { "x-wanym-site-key": env.namyApiKey } : {}),
        "x-wanym-event": "order.created",
        "x-wanym-order": order.reference,
      },
      body: JSON.stringify({ event: "order.created", source: "wanymsolution.com", order }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, error: `NAMY responded ${res.status}` };
    let ref: string | undefined;
    try {
      const json = (await res.json()) as Record<string, unknown>;
      ref = String(json.reference ?? json.ref ?? json.id ?? "") || undefined;
    } catch {
      /* non-JSON ack is fine */
    }
    return { ok: true, ref };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
