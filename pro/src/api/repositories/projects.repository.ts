
import { getDatabase } from "../database";
import { AppError } from "../errors";
import type { Project, ProjectStatus } from "@/lib/types";

interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWrite {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ProjectListQuery {
  search?: string;
  status?: ProjectStatus;
  sortBy: "createdAt" | "name" | "status" | "startDate" | "endDate";
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
}

const SORT_COLUMNS: Record<ProjectListQuery["sortBy"], string> = {
  createdAt: "created_at",
  name: "name",
  status: "status",
  startDate: "start_date",
  endDate: "end_date",
};

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toColumns(input: ProjectWrite): Record<string, unknown> {
  const columns: Record<string, unknown> = {};

  if (input.name !== undefined) {
    columns["name"] = input.name;
  }

  if (input.description !== undefined) {
    columns["description"] = input.description;
  }

  if (input.status !== undefined) {
    columns["status"] = input.status;
  }

  if (input.startDate !== undefined) {
    columns["start_date"] = input.startDate;
  }

  if (input.endDate !== undefined) {
    columns["end_date"] = input.endDate;
  }

  return columns;
}

export async function listProjects(
  userId: string,
  query: ProjectListQuery,
): Promise<{ items: Project[]; total: number }> {
  const db = await getDatabase();

  let builder = db
    .from("projects")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (query.status) {
    builder = builder.eq("status", query.status);
  }

  if (query.search) {
    builder = builder.ilike("name", `%${query.search}%`);
  }

  const from = (query.page - 1) * query.limit;

  const { data, error, count } = await builder
    .order(SORT_COLUMNS[query.sortBy], {
      ascending: query.sortOrder === "asc",
      nullsFirst: false,
    })
    .range(from, from + query.limit - 1);

  if (error) {
    console.error("listProjects Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to load projects: ${error.message}`,
    );
  }

  return {
    items: (data ?? []).map((row) => toProject(row as ProjectRow)),
    total: count ?? 0,
  };
}

export async function findProjectById(
  id: string,
): Promise<Project | null> {
  const db = await getDatabase();

  const { data, error } = await db
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("findProjectById Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to load project: ${error.message}`,
    );
  }

  return data ? toProject(data as ProjectRow) : null;
}

export async function insertProject(
  userId: string,
  input: ProjectWrite,
): Promise<Project> {
  const db = await getDatabase();

  const { data, error } = await db
    .from("projects")
    .insert({
      user_id: userId,
      ...toColumns(input),
    })
    .select("*")
    .single();

  if (error) {
    console.error("insertProject Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to create project: ${error.message}`,
    );
  }

  return toProject(data as ProjectRow);
}

export async function updateProjectById(
  id: string,
  input: ProjectWrite,
): Promise<Project> {
  const db = await getDatabase();

  const { data, error } = await db
    .from("projects")
    .update(toColumns(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("updateProjectById Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to update project: ${error.message}`,
    );
  }

  return toProject(data as ProjectRow);
}

export async function deleteProjectById(
  id: string,
): Promise<void> {
  const db = await getDatabase();

  const { error } = await db
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteProjectById Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to delete project: ${error.message}`,
    );
  }
}

export async function countProjectsByStatus(
  userId: string,
): Promise<Record<ProjectStatus, number>> {
  const db = await getDatabase();

  const { data, error } = await db
    .from("projects")
    .select("status")
    .eq("user_id", userId);

  if (error) {
    console.error("countProjectsByStatus Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to load project statistics: ${error.message}`,
    );
  }

  const counts: Record<ProjectStatus, number> = {
    "Not Started": 0,
    "In Progress": 0,
    "Completed": 0,
  };

  for (const row of (data ?? []) as { status: ProjectStatus }[]) {
    if (row.status in counts) {
      counts[row.status] += 1;
    }
  }

  return counts;
}

export async function listProjectIds(
  userId: string,
): Promise<string[]> {
  const db = await getDatabase();

  const { data, error } = await db
    .from("projects")
    .select("id")
    .eq("user_id", userId);

  if (error) {
    console.error("listProjectIds Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to load projects: ${error.message}`,
    );
  }

  return ((data ?? []) as { id: string }[]).map(
    (row) => row.id,
  );
}
