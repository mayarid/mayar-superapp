import type { MayarConfig, MayarEnvironment } from "./config"

/**
 * Mayar exposes two path prefixes. Everything lives under `/hl/v2` except
 * license operations, which live under `/saas/v2`. Paths passed to `mayarFetch`
 * include their own prefix, so only the host varies by environment.
 */
const HOST: Record<MayarEnvironment, string> = {
  sandbox: "https://api.mayar.io",
  production: "https://api.mayar.id",
}

/** A single entry from Mayar's validator error array. */
export interface MayarValidationIssue {
  type: string
  message: string
  field: string
  expected?: string
  actual?: unknown
}

interface MayarEnvelope<T> {
  /** Optional on purpose: a malformed response may omit it entirely. */
  statusCode?: number
  /** Most endpoints use the plural form. Some write endpoints use `message`. */
  messages?: string
  message?: string
  data?: T
  /** List endpoints put pagination beside `data`, not inside it. */
  hasMore?: boolean
  nextStartingAfter?: string | null
}

/** A page from a list endpoint, with its cursor kept rather than discarded. */
export interface MayarPage<T> {
  items: T[]
  hasMore: boolean
  nextStartingAfter: string | null
}

export class MayarApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly issues: MayarValidationIssue[] = []
  ) {
    super(message)
    this.name = "MayarApiError"
  }

  /** True when Mayar rejected a duplicate create and wants us to wait. */
  get isDuplicate(): boolean {
    return this.statusCode === 429 || this.statusCode === 409
  }
}

function isValidationIssueArray(
  value: unknown
): value is MayarValidationIssue[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "field" in item &&
        "message" in item
    )
  )
}

/**
 * Calls a Mayar V2 endpoint and unwraps its envelope.
 *
 * Two behaviours here are not obvious from the documentation, and both are
 * recorded in docs/api-findings.md:
 *
 *  1. A failed write can return HTTP 200 with `messages: "failed"` and the
 *     validator errors in `data`. Checking the HTTP status alone silently
 *     treats those as successes.
 *  2. Validation errors arrive as an array in `data`, not as a message string,
 *     so the useful detail is lost unless it is read out explicitly.
 */
async function request<T>(
  config: MayarConfig,
  path: string,
  init: RequestInit = {}
): Promise<MayarEnvelope<T>> {
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${config.apiKey}`)
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${HOST[config.environment]}${path}`, {
    ...init,
    headers,
  })

  let body: MayarEnvelope<T>
  try {
    body = await response.json<MayarEnvelope<T>>()
  } catch {
    throw new MayarApiError(
      `Mayar returned a non-JSON response (HTTP ${response.status})`,
      response.status
    )
  }

  const statusCode = body.statusCode ?? response.status
  const text = body.messages ?? body.message
  const issues = isValidationIssueArray(body.data) ? body.data : []

  // `messages: "failed"` is the 200-with-failure case. It must be caught here,
  // or a rejected write looks like a successful one to every caller.
  const failed = !response.ok || statusCode >= 400 || text === "failed"

  if (failed) {
    const detail = issues.length
      ? issues.map((issue) => issue.message).join(" ")
      : (text ?? `HTTP ${response.status}`)
    throw new MayarApiError(detail, statusCode, issues)
  }

  return body
}

/** Calls an endpoint and returns its `data` payload. */
export async function mayarFetch<T>(
  config: MayarConfig,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const body = await request<T>(config, path, init)
  return body.data as T
}

/**
 * Calls a list endpoint and keeps its cursor.
 *
 * List endpoints place `hasMore` and `nextStartingAfter` beside `data` rather
 * than inside it, so returning `data` alone would drop the cursor and hide the
 * fact that results were truncated.
 */
export async function mayarFetchPage<T>(
  config: MayarConfig,
  path: string,
  init: RequestInit = {}
): Promise<MayarPage<T>> {
  const body = await request<T[]>(config, path, init)
  return {
    items: body.data ?? [],
    hasMore: body.hasMore ?? false,
    nextStartingAfter: body.nextStartingAfter ?? null,
  }
}
