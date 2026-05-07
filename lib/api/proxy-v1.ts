import {
  getApiBaseUrl,
  MISSING_API_BASE_ERROR,
} from "@/lib/api/auth-upstream";
import { formatUpstreamJsonError } from "@/lib/api/upstream-errors";

/**
 * Proxies an authenticated request to `GET ${NEXT_API_URL}{pathnameAndQuery}`
 * (`pathnameAndQuery` must start with `/api/v1`).
 * Requires an `Authorization` header on the incoming request.
 */
export async function proxyV1GetJson(
  request: Request,
  pathnameAndQuery: string,
): Promise<Response> {
  const base = getApiBaseUrl();
  if (!base) {
    return Response.json(
      { error: MISSING_API_BASE_ERROR },
      { status: 503 },
    );
  }

  const authHeader =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");
  if (!authHeader) {
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const url = `${base}${pathnameAndQuery.startsWith("/") ? pathnameAndQuery : `/${pathnameAndQuery}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { error: "Could not reach the API. Check your connection." },
      { status: 502 },
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    const message = text.slice(0, 280) || "Unexpected response from API.";
    return Response.json(
      { error: res.ok ? message : message || "Request failed" },
      {
        status: res.ok ? 502 : res.status,
      },
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
    const message = formatUpstreamJsonError(data);
    if (process.env.NODE_ENV === "development" && res.status >= 500) {
      console.error("[proxyV1GetJson] upstream GET failed", {
        url,
        status: res.status,
        body: data,
      });
      return Response.json(
        { error: message, upstream: data },
        { status: res.status },
      );
    }
    return Response.json({ error: message }, { status: res.status });
  }

  return Response.json(data, { status: res.status });
}

/**
 * Proxies `POST ${NEXT_API_URL}{pathname}` with the incoming JSON body (and Content-Type).
 * `pathname` must start with `/api/v1`.
 */
export async function proxyV1PostJson(
  request: Request,
  pathname: string,
): Promise<Response> {
  const base = getApiBaseUrl();
  if (!base) {
    return Response.json(
      { error: MISSING_API_BASE_ERROR },
      { status: 503 },
    );
  }

  const authHeader =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");
  if (!authHeader) {
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const bodyText = await request.text();
  const contentType =
    request.headers.get("content-type")?.trim() || "application/json";

  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = `${base}${path}`;

  let res: Response;
  try {
    const fwdHeaders: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": contentType,
      Authorization: authHeader,
    };
    const idem =
      request.headers.get("x-idempotency-key") ??
      request.headers.get("X-Idempotency-Key");
    if (idem?.trim()) {
      fwdHeaders["X-Idempotency-Key"] = idem.trim();
    }
    res = await fetch(url, {
      method: "POST",
      headers: fwdHeaders,
      body: bodyText.length > 0 ? bodyText : undefined,
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { error: "Could not reach the API. Check your connection." },
      { status: 502 },
    );
  }

  const location = res.headers.get("Location") ?? res.headers.get("location");
  const rawText = await res.text().catch(() => "");

  let data: unknown;
  if (rawText.trim()) {
    try {
      data = JSON.parse(rawText) as unknown;
    } catch {
      data = { raw: rawText };
    }
  } else {
    data = {};
  }

  if (!res.ok) {
    return Response.json(
      {
        error: formatUpstreamJsonError(
          typeof data === "object" && data !== null
            ? data
            : { detail: String(data) },
        ),
      },
      { status: res.status },
    );
  }

  const envelope: Record<string, unknown> =
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? { ...(data as Record<string, unknown>) }
      : { payload: data };

  const hasCheckout =
    typeof envelope.checkout_url === "string" ||
    typeof envelope.payment_url === "string" ||
    typeof envelope.authorization_url === "string" ||
    (typeof envelope.url === "string" && /^https?:\/\//i.test(envelope.url));

  if (
    location &&
    envelope.redirect_url === undefined &&
    !hasCheckout &&
    typeof envelope.paymentUrl !== "string" &&
    typeof envelope.checkoutUrl !== "string"
  ) {
    envelope.redirect_url = location;
  }

  return Response.json(envelope, { status: res.status });
}

/**
 * Proxies `PATCH ${NEXT_API_URL}{pathname}` with the incoming JSON body.
 * `pathname` must start with `/api/v1`.
 */
export async function proxyV1PatchJson(
  request: Request,
  pathname: string,
): Promise<Response> {
  const base = getApiBaseUrl();
  if (!base) {
    return Response.json(
      { error: MISSING_API_BASE_ERROR },
      { status: 503 },
    );
  }

  const authHeader =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");
  if (!authHeader) {
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const bodyText = await request.text();
  const contentType =
    request.headers.get("content-type")?.trim() || "application/json";
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = `${base}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": contentType,
        Authorization: authHeader,
      },
      body: bodyText.length > 0 ? bodyText : undefined,
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { error: "Could not reach the API. Check your connection." },
      { status: 502 },
    );
  }

  const rawText = await res.text().catch(() => "");
  let data: unknown;
  if (rawText.trim()) {
    try {
      data = JSON.parse(rawText) as unknown;
    } catch {
      data = { raw: rawText };
    }
  } else {
    data = {};
  }

  if (!res.ok) {
    return Response.json(
      {
        error: formatUpstreamJsonError(
          typeof data === "object" && data !== null
            ? data
            : { detail: String(data) },
        ),
      },
      { status: res.status },
    );
  }

  return Response.json(
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? data
      : { payload: data },
    { status: res.status },
  );
}

/**
 * Proxies `DELETE ${NEXT_API_URL}{pathname}`. Optionally forwards JSON body if present.
 * `pathname` must start with `/api/v1`.
 */
export async function proxyV1Delete(
  request: Request,
  pathname: string,
): Promise<Response> {
  const base = getApiBaseUrl();
  if (!base) {
    return Response.json(
      { error: MISSING_API_BASE_ERROR },
      { status: 503 },
    );
  }

  const authHeader =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");
  if (!authHeader) {
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const bodyText = await request.text();
  const hasBody = bodyText.length > 0;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = `${base}${path}`;

  const headers: HeadersInit = {
    Accept: "application/json",
    Authorization: authHeader,
  };
  if (hasBody) {
    const contentType =
      request.headers.get("content-type")?.trim() || "application/json";
    (headers as Record<string, string>)["Content-Type"] = contentType;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "DELETE",
      headers,
      body: hasBody ? bodyText : undefined,
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { error: "Could not reach the API. Check your connection." },
      { status: 502 },
    );
  }

  const rawText = await res.text().catch(() => "");
  let data: unknown;
  if (rawText.trim()) {
    try {
      data = JSON.parse(rawText) as unknown;
    } catch {
      data = { raw: rawText };
    }
  } else {
    data = {};
  }

  if (!res.ok) {
    return Response.json(
      {
        error: formatUpstreamJsonError(
          typeof data === "object" && data !== null
            ? data
            : { detail: String(data) },
        ),
      },
      { status: res.status },
    );
  }

  return Response.json(
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? data
      : { payload: data },
    { status: res.status },
  );
}

/**
 * Proxies `POST ${NEXT_API_URL}{pathname}` with `multipart/form-data` (forwarded as `FormData`).
 * Does not set `Content-Type` — the runtime sets the boundary. `pathname` must start with `/api/v1`.
 */
export async function proxyV1PostMultipart(
  request: Request,
  pathname: string,
): Promise<Response> {
  const base = getApiBaseUrl();
  if (!base) {
    return Response.json(
      { error: MISSING_API_BASE_ERROR },
      { status: 503 },
    );
  }

  const authHeader =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");
  if (!authHeader) {
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = `${base}${path}`;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid multipart body." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: formData,
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { error: "Could not reach the API. Check your connection." },
      { status: 502 },
    );
  }

  const rawText = await res.text().catch(() => "");

  let data: unknown;
  if (rawText.trim()) {
    try {
      data = JSON.parse(rawText) as unknown;
    } catch {
      data = { raw: rawText };
    }
  } else {
    data = {};
  }

  if (!res.ok) {
    return Response.json(
      {
        error: formatUpstreamJsonError(
          typeof data === "object" && data !== null
            ? data
            : { detail: String(data) },
        ),
      },
      { status: res.status },
    );
  }

  return Response.json(
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? data
      : { payload: data },
    { status: res.status },
  );
}
