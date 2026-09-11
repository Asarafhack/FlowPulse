import { AppError } from "./errors";
import { logger } from "./logger";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

export function ok(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), { status, headers: JSON_HEADERS });
}

export function fail(status: number, message: string, errors?: unknown): Response {
  const body: Record<string, unknown> = { success: false, message };
  if (errors) body["errors"] = errors;
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed = await request.json();
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new AppError(400, "Request body must be a JSON object");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, "Invalid JSON request body");
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("cf-connecting-ip") ?? "unknown";
}

export async function handleRequest(
  request: Request,
  run: () => Promise<Response>,
): Promise<Response> {
  const started = Date.now();
  const method = request.method;
  const path = new URL(request.url).pathname;

  try {
    const response = await run();
    logger.info("http_request", { method, path, status: response.status, ms: Date.now() - started });
    return response;
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn("http_error", { method, path, status: error.status, message: error.message });
      return fail(error.status, error.message, error.errors);
    }
    logger.error("http_unhandled_error", {
      method,
      path,
      message: error instanceof Error ? error.message : "unknown error",
    });
    return fail(500, "Internal server error");
  }
}
