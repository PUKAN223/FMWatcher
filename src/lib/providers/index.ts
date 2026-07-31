/**
 * Provider Registry
 *
 * Add new providers here. Each entry must implement ProviderAdapter.
 * The system picks the first adapter whose .matches() returns true.
 */

import type { ProviderAdapter } from "./types";
import { KrungthaiConnextAdapter } from "./krungthai-connext";

// ── Register all adapters here ───────────────────────────────────────────────
const REGISTRY: ProviderAdapter[] = [
  KrungthaiConnextAdapter,
  // Add future adapters here, e.g.:
  // KBankAdapter,
  // SCBAdapter,
  // TTBAdapter,
];

/**
 * Find a matching adapter for the given LINE sender display-name.
 * Returns undefined if no adapter matches.
 */
export function findAdapter(senderName: string): ProviderAdapter | undefined {
  return REGISTRY.find((adapter) => adapter.matches(senderName));
}

/**
 * Get adapter by its unique ID (e.g. "krungthai_connext").
 */
export function getAdapterById(id: string): ProviderAdapter | undefined {
  return REGISTRY.find((a) => a.id === id);
}

/**
 * List all registered providers (for UI display).
 */
export function listProviders(): Pick<ProviderAdapter, "id" | "name">[] {
  return REGISTRY.map(({ id, name }) => ({ id, name }));
}

export type { ProviderAdapter };
export type { TransferEvent } from "./types";
