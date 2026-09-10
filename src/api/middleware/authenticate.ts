import { unauthorized } from "../errors";
import { logger } from "../logger";
import { verifyAccessToken } from "../security/tokens";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export async function authenticate(
  request: Request,
): Promise<AuthenticatedUser> {
  const header = request.headers.get("authorization");

  logger.info("auth_debug", {
    path: new URL(request.url).pathname,
    hasAuthorizationHeader: Boolean(header),
    authorizationPrefix: header
      ? header.slice(0, 20)
      : null,
  });

  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    logger.warn("auth_missing_bearer", {
      path: new URL(request.url).pathname,
      hasAuthorizationHeader: Boolean(header),
    });

    throw unauthorized();
  }

  const token = header.slice(7).trim();

  logger.info("auth_token_debug", {
    path: new URL(request.url).pathname,
    hasToken: Boolean(token),
    tokenLength: token.length,
  });

  if (!token) {
    throw unauthorized();
  }

  const claims = await verifyAccessToken(token);

  logger.info("auth_verified", {
    path: new URL(request.url).pathname,
    userId: claims.sub,
  });

  return {
    id: claims.sub,
    email: claims.email,
    role: claims.role,
  };
}