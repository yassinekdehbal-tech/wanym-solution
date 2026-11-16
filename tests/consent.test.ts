import assert from "node:assert/strict";
import { test } from "node:test";
import { CONSENT_MAX_AGE_MS, parseConsent, serializeConsent } from "../src/lib/consent.ts";

test("a stored choice round-trips and expires after six months", () => {
  const now = 1_800_000_000_000;
  const yes = parseConsent(serializeConsent(true, now), now);
  assert.equal(yes?.ads, true);
  const no = parseConsent(serializeConsent(false, now), now);
  assert.equal(no?.ads, false);
  assert.equal(parseConsent(serializeConsent(true, now), now + CONSENT_MAX_AGE_MS + 1), null, "an old choice must be asked again");
});

test("anything unreadable means no consent", () => {
  assert.equal(parseConsent(null), null);
  assert.equal(parseConsent("garbage"), null);
  assert.equal(parseConsent(JSON.stringify({ ads: "yes", at: 1, v: 1 })), null);
  assert.equal(parseConsent(JSON.stringify({ ads: true, at: Date.now(), v: 0 })), null, "another version is asked again");
});
