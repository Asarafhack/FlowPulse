import { SignJWT, jwtVerify } from "jose";

import { getConfig } from "../config";
import { unauthorized } from "../errors";

export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: string;
}

function key(): Uint8Array {
  return new TextEncoder().encode(getConfig().jwtSecret);
}

export async function signAccessToken(claims: AccessTokenClaims): Promise<string> {
  return new SignJWT({ email: claims.email, role: claims.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(getConfig().jwtExpiresIn)
    .sign(key());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload["email"] !== "string") {
      throw unauthorized("Invalid authentication token");
    }
    return {
      sub: payload.sub,
      email: payload["email"],
      role: typeof payload["role"] === "string" ? payload["role"] : "USER",
    };
  } catch {
    throw unauthorized("Invalid or expired authentication token");
  }
}
