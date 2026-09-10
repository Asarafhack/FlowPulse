import { conflict, unauthorized } from "../errors";
import { logger } from "../logger";
import { findUserByEmail, insertUser, toPublicUser } from "../repositories/users.repository";
import { hashPassword, verifyPassword } from "../security/password";
import { signAccessToken } from "../security/tokens";
import type { PublicUser } from "@/lib/types";

export interface AuthResult {
  user: PublicUser;
  token: string;
}

export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const existing = await findUserByEmail(input.email);
  if (existing) throw conflict("An account with this email already exists");

  const passwordHash = await hashPassword(input.password);
  const created = await insertUser({
    fullName: input.fullName,
    email: input.email,
    passwordHash,
  });

  logger.info("user_registered", { userId: created.id });
  const user = toPublicUser(created);
  const token = await signAccessToken({ sub: user.id, email: user.email, role: user.role });
  return { user, token };
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthResult> {
  const record = await findUserByEmail(input.email);
  if (!record) {
    logger.warn("login_failed", { reason: "unknown_email" });
    throw unauthorized("Invalid email or password");
  }

  const matches = await verifyPassword(input.password, record.passwordHash);
  if (!matches) {
    logger.warn("login_failed", { reason: "bad_password", userId: record.id });
    throw unauthorized("Invalid email or password");
  }

  logger.info("login_succeeded", { userId: record.id });
  const user = toPublicUser(record);
  const token = await signAccessToken({ sub: user.id, email: user.email, role: user.role });
  return { user, token };
}
