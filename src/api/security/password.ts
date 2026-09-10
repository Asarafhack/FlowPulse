import bcrypt from "bcryptjs";

import { getConfig } from "../config";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, getConfig().bcryptRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
