type Level = "info" | "warn" | "error";

const REDACTED = new Set(["password", "confirmPassword", "passwordHash", "token", "authorization"]);

function scrub(payload: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    safe[key] = REDACTED.has(key) ? "[redacted]" : value;
  }
  return safe;
}

function write(level: Level, event: string, payload: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...scrub(payload),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, payload?: Record<string, unknown>) => write("info", event, payload),
  warn: (event: string, payload?: Record<string, unknown>) => write("warn", event, payload),
  error: (event: string, payload?: Record<string, unknown>) => write("error", event, payload),
};
