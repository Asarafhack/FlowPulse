
import { getDatabase } from "../database";
import { AppError } from "../errors";
import type { PublicUser } from "@/lib/types";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface UserRecord extends PublicUser {
  passwordHash: string;
}

function toRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    passwordHash: row.password_hash,
  };
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export async function findUserByEmail(
  email: string,
): Promise<UserRecord | null> {
  const db = await getDatabase();

  const { data, error } = await db
    .from("app_users")
    .select("*")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    console.error("findUserByEmail Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to read account: ${error.message}`,
    );
  }

  return data ? toRecord(data as UserRow) : null;
}

export async function findUserById(
  id: string,
): Promise<UserRecord | null> {
  const db = await getDatabase();

  const { data, error } = await db
    .from("app_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("findUserById Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to read account: ${error.message}`,
    );
  }

  return data ? toRecord(data as UserRow) : null;
}

export async function insertUser(input: {
  fullName: string;
  email: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const db = await getDatabase();

  const { data, error } = await db
    .from("app_users")
    .insert({
      full_name: input.fullName,
      email: input.email,
      password_hash: input.passwordHash,
    })
    .select("*")
    .single();

  if (error) {
    console.error("insertUser Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (
      error.code === "23505" ||
      error.code === "23000" ||
      error.message.toLowerCase().includes("duplicate")
    ) {
      throw new AppError(
        409,
        "An account with this email already exists",
      );
    }

    throw new AppError(
      500,
      `Unable to create account: ${error.message}`,
    );
  }

  return toRecord(data as UserRow);
}
