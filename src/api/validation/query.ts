import type { ProjectListQuery } from "../repositories/projects.repository";
import type { TaskListQuery } from "../repositories/tasks.repository";
import { parseOrThrow, projectQuerySchema, queryParams, taskQuerySchema } from "./schemas";

export function projectListQuery(request: Request): ProjectListQuery {
  const parsed = parseOrThrow(projectQuerySchema, queryParams(request));
  const query: ProjectListQuery = {
    sortBy: parsed.sortBy ?? "createdAt",
    sortOrder: parsed.sortOrder ?? "desc",
    page: parsed.page ?? 1,
    limit: parsed.limit ?? 12,
  };
  if (parsed.search) query.search = parsed.search;
  if (parsed.status) query.status = parsed.status;
  return query;
}

export function taskListQuery(request: Request): TaskListQuery {
  const parsed = parseOrThrow(taskQuerySchema, queryParams(request));
  const query: TaskListQuery = {
    sortBy: parsed.sortBy ?? "createdAt",
    sortOrder: parsed.sortOrder ?? "desc",
    page: parsed.page ?? 1,
    limit: parsed.limit ?? 20,
  };
  if (parsed.search) query.search = parsed.search;
  if (parsed.status) query.status = parsed.status;
  if (parsed.priority) query.priority = parsed.priority;
  if (parsed.projectId) query.projectId = parsed.projectId;
  return query;
}
