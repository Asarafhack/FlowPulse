import type { FieldError } from "@/api/errors";

export const TOKEN_STORAGE_KEY = "flowpulse.token";

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldError[];

  constructor(
    status: number,
    message: string,
    fieldErrors: FieldError[] = [],
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/* --------------------------------
   TOKEN
-------------------------------- */

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(
      TOKEN_STORAGE_KEY,
    );
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (token) {
      window.localStorage.setItem(
        TOKEN_STORAGE_KEY,
        token,
      );
    } else {
      window.localStorage.removeItem(
        TOKEN_STORAGE_KEY,
      );
    }
  } catch {
    // Storage may be unavailable.
  }
}

/* --------------------------------
   REQUEST OPTIONS
-------------------------------- */

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<
    string,
    string | number | undefined
  >;
  auth?: boolean;
}

/* --------------------------------
   API REQUEST
-------------------------------- */

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    auth = true,
  } = options;

  /*
   * API base URL:
   *
   * VITE_API_BASE_URL=http://localhost:3001
   *
   * If it is not configured, use the current
   * browser origin.
   */
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    window.location.origin;

  const url = new URL(path, baseUrl);

  /* --------------------------------
     QUERY PARAMETERS
  -------------------------------- */

  if (query) {
    for (const [key, value] of Object.entries(
      query,
    )) {
      if (
        value !== undefined &&
        value !== ""
      ) {
        url.searchParams.set(
          key,
          String(value),
        );
      }
    }
  }

  /* --------------------------------
     HEADERS
  -------------------------------- */

  const headers: Record<string, string> = {
    accept: "application/json",
  };

  if (body !== undefined) {
    headers["content-type"] =
      "application/json";
  }

  /*
   * Attach JWT token to protected API calls.
   */
  if (auth) {
    const token = getToken();

    if (token) {
      headers["authorization"] =
        `Bearer ${token}`;
    }
  }

  /* --------------------------------
     FETCH
  -------------------------------- */

  let response: Response;

  try {
    response = await fetch(
      url.toString(),
      {
        method,
        headers,
        body:
          body === undefined
            ? undefined
            : JSON.stringify(body),
      },
    );
  } catch {
    throw new ApiError(
      0,
      "Unable to connect to the server. Please make sure the FlowPulse API is running.",
    );
  }

  /* --------------------------------
     READ RESPONSE
  -------------------------------- */

  const raw = await response.text();

  let payload: unknown = null;

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  const record = (payload ?? {}) as {
    success?: boolean;
    data?: T;
    message?: string;
    errors?: FieldError[];
  };

  /* --------------------------------
     ERROR HANDLING
  -------------------------------- */

  if (
    !response.ok ||
    record.success === false
  ) {
    /*
     * Authentication failed.
     *
     * Clear the invalid token so the user
     * can sign in again.
     */
    if (response.status === 401) {
      setToken(null);

      throw new ApiError(
        401,
        record.message ??
          "Your session has expired. Please sign in again.",
        record.errors ?? [],
      );
    }

    throw new ApiError(
      response.status,
      record.message ??
        "Something went wrong. Please try again.",
      record.errors ?? [],
    );
  }

  /* --------------------------------
     SUCCESS
  -------------------------------- */

  return record.data as T;
}

/* --------------------------------
   FIELD ERROR MAP
-------------------------------- */

export function fieldErrorMap(
  error: unknown,
): Record<string, string> {
  if (!(error instanceof ApiError)) {
    return {};
  }

  const map: Record<string, string> = {};

  for (const item of error.fieldErrors) {
    if (!map[item.field]) {
      map[item.field] = item.message;
    }
  }

  return map;
}

/* --------------------------------
   ERROR MESSAGE
-------------------------------- */

export function errorMessage(
  error: unknown,
): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}