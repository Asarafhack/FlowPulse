import { forbidden, notFound } from "../errors";
import { findProjectById } from "../repositories/projects.repository";
import {
  deleteTaskById,
  findTaskById,
  insertTask,
  listTasksForUser,
  updateTaskById,
  type TaskListQuery,
  type TaskWrite,
} from "../repositories/tasks.repository";
import { assertProjectOwnership } from "./projects.service";
import type { Paginated, Task } from "@/lib/types";

function emptyToNull(input: TaskWrite): TaskWrite {
  const normalized = { ...input };
  if (normalized.description === "") normalized.description = null;
  if (normalized.dueDate === "") normalized.dueDate = null;
  return normalized;
}

async function assertTaskOwnership(taskId: string, userId: string): Promise<Task> {
  const task = await findTaskById(taskId);
  if (!task) throw notFound("Task not found");
  const project = await findProjectById(task.projectId);
  if (!project) throw notFound("Task not found");
  if (project.userId !== userId) throw forbidden("You do not have access to this task");
  return task;
}

export async function getTasks(userId: string, query: TaskListQuery): Promise<Paginated<Task>> {
  if (query.projectId) await assertProjectOwnership(query.projectId, userId);
  const { items, total } = await listTasksForUser(userId, query);
  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getTask(taskId: string, userId: string): Promise<Task> {
  return assertTaskOwnership(taskId, userId);
}

export async function createTask(userId: string, input: TaskWrite): Promise<Task> {
  await assertProjectOwnership(input.projectId!, userId);
  return insertTask(emptyToNull(input));
}

export async function updateTask(
  taskId: string,
  userId: string,
  input: TaskWrite,
): Promise<Task> {
  await assertTaskOwnership(taskId, userId);
  if (input.projectId) await assertProjectOwnership(input.projectId, userId);
  return updateTaskById(taskId, emptyToNull(input));
}

export async function deleteTask(taskId: string, userId: string): Promise<void> {
  await assertTaskOwnership(taskId, userId);
  await deleteTaskById(taskId);
}
