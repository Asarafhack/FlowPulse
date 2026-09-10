
import { getDatabase } from "../database";
import { AppError } from "../errors";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";

interface TaskRow {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  projects?: {
    name?: string;
    user_id?: string;
  } | null;
}

export interface TaskWrite {
  projectId?: string;
  name?: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
}

export interface TaskListQuery {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  sortBy: "createdAt" | "name" | "dueDate" | "priority" | "status";
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
}

const SORT_COLUMNS: Record<TaskListQuery["sortBy"], string> = {
  createdAt: "created_at",
  name: "title",
  dueDate: "due_date",
  priority: "priority",
  status: "status",
};

function toTask(row: TaskRow): Task {
  const task: Task = {
    id: row.id,
    projectId: row.project_id,
    name: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.projects?.name) {
    task.projectName = row.projects.name;
  }

  return task;
}

function toColumns(input: TaskWrite): Record<string, unknown> {
  const columns: Record<string, unknown> = {};

  if (input.projectId !== undefined) {
    columns["project_id"] = input.projectId;
  }

  if (input.name !== undefined) {
    columns["title"] = input.name;
  }

  if (input.description !== undefined) {
    columns["description"] = input.description;
  }

  if (input.priority !== undefined) {
    columns["priority"] = input.priority;
  }

  if (input.status !== undefined) {
    columns["status"] = input.status;
  }

  if (input.dueDate !== undefined) {
    columns["due_date"] = input.dueDate;
  }

  return columns;
}

export async function listTasksForUser(
  userId: string,
  query: TaskListQuery,
): Promise<{ items: Task[]; total: number }> {
  const db = await getDatabase();

  let builder = db
    .from("tasks")
    .select("*, projects!inner(name, user_id)", {
      count: "exact",
    })
    .eq("projects.user_id", userId);

  if (query.projectId) {
    builder = builder.eq("project_id", query.projectId);
  }

  if (query.status) {
    builder = builder.eq("status", query.status);
  }

  if (query.priority) {
    builder = builder.eq("priority", query.priority);
  }

  if (query.search) {
    builder = builder.ilike(
      "title",
      `%${query.search}%`,
    );
  }

  const from = (query.page - 1) * query.limit;

  const { data, error, count } = await builder
    .order(SORT_COLUMNS[query.sortBy], {
      ascending: query.sortOrder === "asc",
      nullsFirst: false,
    })
    .range(from, from + query.limit - 1);

  if (error) {
    console.error("listTasksForUser Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to load tasks: ${error.message}`,
    );
  }

  return {
    items: (data ?? []).map(
      (row) => toTask(row as TaskRow),
    ),
    total: count ?? 0,
  };
}

export async function findTaskById(
  id: string,
): Promise<Task | null> {
  const db = await getDatabase();

  const { data, error } = await db
    .from("tasks")
    .select("*, projects(name, user_id)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("findTaskById Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to load task: ${error.message}`,
    );
  }

  return data ? toTask(data as TaskRow) : null;
}

export async function insertTask(
  input: TaskWrite,
): Promise<Task> {
  const db = await getDatabase();

  const { data, error } = await db
    .from("tasks")
    .insert(toColumns(input))
    .select("*")
    .single();

  if (error) {
    console.error("insertTask Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to create task: ${error.message}`,
    );
  }

  return toTask(data as TaskRow);
}

export async function updateTaskById(
  id: string,
  input: TaskWrite,
): Promise<Task> {
  const db = await getDatabase();

  const { data, error } = await db
    .from("tasks")
    .update(toColumns(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("updateTaskById Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to update task: ${error.message}`,
    );
  }

  return toTask(data as TaskRow);
}

export async function deleteTaskById(
  id: string,
): Promise<void> {
  const db = await getDatabase();

  const { error } = await db
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteTaskById Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new AppError(
      500,
      `Unable to delete task: ${error.message}`,
    );
  }
}

export async function listTaskFactsForProjects(
  projectIds: string[],
): Promise<
  {
    projectId: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
  }[]
> {
  if (projectIds.length === 0) {
    return [];
  }

  const db = await getDatabase();

  const { data, error } = await db
    .from("tasks")
    .select(
      "project_id, status, priority, due_date",
    )
    .in("project_id", projectIds);

  if (error) {
    console.error(
      "listTaskFactsForProjects Supabase error:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      },
    );

    throw new AppError(
      500,
      `Unable to load task statistics: ${error.message}`,
    );
  }

  return (
    (data ?? []) as {
      project_id: string;
      status: TaskStatus;
      priority: TaskPriority;
      due_date: string | null;
    }[]
  ).map((row) => ({
    projectId: row.project_id,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
  }));
}
