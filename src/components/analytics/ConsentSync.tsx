"use client";

import { useEffect } from "react";
import { applyConsent, readStoredConsent } from "@/lib/analytics/consent";

/**
 * Replays an already-stored consent decision into Consent Mode on load.
 *
 * Without this, a returning visitor who accepted analytics last month would
 * still be measured under the denied default on every subsequent visit — the
 * banner never reappears for them, so nothing else would ever push an update.
 * Renders nothing.
 */
export function ConsentSync() {
  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) applyConsent(stored);
  }, []);

  return null;
}
