import { formatUpstreamJsonError } from "./upstream-errors";

const AUTH_PREFIX = "/api/v1/auth";

/**
 * Cloudflare (and similar) often challenge server-side fetch() with default Node UA.
 * Use a stable browser-like UA for outbound auth calls only.
 */
const UPSTREAM_AUTH_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Ethitrust-BFF/1";

const INCOMING_HEADER_ALLOWLIST = [
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-forwarded-host",
  "x-real-ip",
  "cf-connecting-ip",
  "cf-ray",
  "true-client-ip",
  "forwarded",
  "origin",
  "referer",
] as const;

function buildForwardedClientHeaders(
  incoming: Request,
): Record<string, string> {
  const h: Record<string, string> = {};
  for (const name of INCOMING_HEADER_ALLOWLIST) {
    const v = incoming.headers.get(name);
    if (v) h[name] = v;
  }
  return h;
}

/**
 * Base URL for Route Handlers → Ethitrust API (server-side only).
 * Prefer `NEXT_API_INTERNAL_URL` so Node `fetch()` does not hit Cloudflare on the
 * public `api.*` hostname (CF returns 403 HTML “Just a moment…” to many datacenter requests).
 */
export function getApiBaseUrl(): string | null {
  const internal = process.env.NEXT_API_INTERNAL_URL?.trim();
  if (internal) {
    return internal.replace(/\/+$/, "");
  }
  const raw = process.env.NEXT_API_URL?.trim();
  if (!raw) {
    return null;
  }
  return raw.replace(/\/+$/, "");
}

/** Shared copy for 503 when neither public nor internal API base is configured. */
export const MISSING_API_BASE_ERROR =
  "Server is not configured (set NEXT_API_URL or NEXT_API_INTERNAL_URL).";

type AuthSegment =
  | "register"
  | "login"
  | "verify-email"
  | "resend-verification";

export async function postAuthUpstream(
  segment: AuthSegment,
  body: unknown,
  incoming?: Request,
): Promise<Response> {
  const base = getApiBaseUrl();
  if (!base) {
    return Response.json({ error: MISSING_API_BASE_ERROR }, { status: 503 });
  }

  const headers: Record<string, string> = {
    ...(incoming ? buildForwardedClientHeaders(incoming) : {}),
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": UPSTREAM_AUTH_USER_AGENT,
  };

  let res: Response;
  try {
    res = await fetch(`${base}${AUTH_PREFIX}/${segment}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    return Response.json(
      { error: "Could not reach the API. Check your connection." },
      { status: 502 },
    );
  }

  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    return Response.json(
      {
        error: res.ok
          ? "Unexpected response from API."
          : text.slice(0, 200) || "Request failed",
      },
      { status: res.ok ? 502 : res.status },
    );
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON from API." },
      { status: res.ok ? 502 : res.status },
    );
  }

  if (!res.ok) {
    return Response.json(
      { error: formatUpstreamJsonError(data) },
      { status: res.status },
    );
  }

  return Response.json(data, { status: res.status });
}
