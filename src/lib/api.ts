import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import type { ZodError } from "zod";

/**
 * Bearer / x-api-key check for every write or private route.
 * `expected` defaults to CONTENT_API_KEY; a route may pass its own key (NAMY inbound webhook).
 */
export function isAuthorized(req: Request, expected: string = env.contentApiKey): boolean {
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const provided = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : (req.headers.get("x-api-key") ?? "");
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(error: ZodError | string) {
  if (typeof error === "string") return NextResponse.json({ error }, { status: 400 });
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_";
    if (!fields[path]) fields[path] = issue.message;
  }
  return NextResponse.json({ error: "Validation failed", fields }, { status: 400 });
}

export function notFound(what = "Not found") {
  return NextResponse.json({ error: what }, { status: 404 });
}

export function serverError(e: unknown, context: string) {
  console.error(`[${context}]`, e);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

export async function readJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}
