import { env } from "cloudflare:workers"

export type MayarEnvironment = "sandbox" | "production"

export interface MayarConfig {
  apiKey: string
  environment: MayarEnvironment
  /** Overrides the host entirely. Set when the environment's URL is disputed. */
  baseUrl?: string
}

/**
 * Reads Mayar configuration from the Worker environment.
 *
 * This must be called per request. Reading `env` at module scope on an edge
 * runtime risks an undefined value, because module evaluation can happen
 * outside a request context.
 */
export function getMayarConfig(): MayarConfig {
  const apiKey = env.MAYAR_API_KEY
  if (!apiKey) {
    throw new Error("MAYAR_API_KEY is not set")
  }

  // Read through a widened type. wrangler types narrows `MAYAR_ENV` to the
  // literal currently in wrangler.jsonc, which would make this comparison look
  // constant to the type checker even though the deployed value can differ.
  const configured: string = env.MAYAR_ENV
  const overrideUrl: string = env.MAYAR_API_URL

  return {
    apiKey,
    environment: configured === "production" ? "production" : "sandbox",
    // The sandbox host is not settled: the API reference gives
    // api.mayar.io, the official CLI targets api.mayar.club, and both
    // answer. Rather than pick one silently, the URL can be set explicitly.
    baseUrl: overrideUrl.length > 0 ? overrideUrl : undefined,
  }
}
