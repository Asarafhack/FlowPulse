function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export interface AppConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  authRateLimitWindowMs: number;
  authRateLimitMax: number;
  logLevel: string;
}

export function getConfig(): AppConfig {
  const jwtSecret = process.env["JWT_SECRET"];
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return {
    jwtSecret,
    jwtExpiresIn: process.env["JWT_EXPIRES_IN"] ?? "1d",
    bcryptRounds: num(process.env["BCRYPT_ROUNDS"], 10),
    authRateLimitWindowMs: num(process.env["AUTH_RATE_LIMIT_WINDOW_MS"], 15 * 60 * 1000),
    authRateLimitMax: num(process.env["AUTH_RATE_LIMIT_MAX"], 10),
    logLevel: process.env["LOG_LEVEL"] ?? "info",
  };
}
