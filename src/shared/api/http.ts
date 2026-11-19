// A small JSON-over-HTTP client. It never reads import.meta.env: the app passes it everything, so tests can use a fake fetch.

/** A failed request, with a message that is safe to show to the person using the app. */
export class ApiError extends Error {
  // a plain field, not a constructor parameter property: Node's type stripping (used by the tests) does not allow those
  readonly status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type HttpOptions = {
  /** The signed-in session's token, if any. */
  getToken?: () => string | null | undefined;
  /** Called on a 401, for example to sign the person out. */
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
};
export type Http = (url: string, init?: { method?: string; body?: unknown }) => Promise<unknown>;

/** Servers usually explain an error as { "message": "..." } or { "error": "..." }. */
function messageFrom(data: unknown): string | undefined {
  const d = data as { message?: unknown; error?: unknown } | null;
  const m = typeof d?.message === "string" ? d.message : typeof d?.error === "string" ? d.error : undefined;
  return m?.trim() || undefined;
}

export function createHttp({ getToken, onUnauthorized, fetchImpl }: HttpOptions = {}): Http {
  const doFetch = fetchImpl ?? ((input, init) => fetch(input, init));
  return async (url, { method = "GET", body } = {}) => {
    const headers: Record<string, string> = { Accept: "application/json" };
    // a file upload (FormData) sets its own Content-Type, with the multipart boundary
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
    const token = getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    let res: Response;
    try {
      res = await doFetch(url, { method, headers, body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body) });
    } catch {
      throw new ApiError("Can't reach the server. Check your connection and try again.");
    }
    const text = await res.text();
    let data: unknown = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* an empty or non-JSON body */ }

    if (!res.ok) {
      if (res.status === 401) onUnauthorized?.();
      throw new ApiError(messageFrom(data) ?? `The server returned an error (${res.status}).`, res.status);
    }
    return data;
  };
}
