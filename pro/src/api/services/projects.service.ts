import { forbidden, notFound } from "../errors";
import {
  deleteProjectById,
  findProjectById,
  insertProject,
  listProjects,
  updateProjectById,
  type ProjectListQuery,
  type ProjectWrite,
} from "../repositories/projects.repository";
import { listTaskFactsForProjects } from "../repositories/tasks.repository";
import type { Paginated, Project } from "@/lib/types";

function emptyToNull<T extends ProjectWrite>(input: T): T {
  const normalized = { ...input };
  if (normalized.description === "") normalized.description = null;
  if (normalized.startDate === "") normalized.startDate = null;
  if (normalized.endDate === "") normalized.endDate = null;
  return normalized;
}

export async function assertProjectOwnership(
  projectId: string,
  userId: string,
): Promise<Project> {
  const project = await findProjectById(projectId);
  if (!project) throw notFound("Project not found");
  if (project.userId !== userId) throw forbidden("You do not have access to this project");
  return project;
}

async function withTaskCounts(projects: Project[]): Promise<Project[]> {
  if (projects.length === 0) return projects;
  const facts = await listTaskFactsForProjects(projects.map((project) => project.id));

  return projects.map((project) => {
    const own = facts.filter((fact) => fact.projectId === project.id);
    return {
      ...project,
      taskCount: own.length,
      completedTaskCount: own.filter((fact) => fact.status === "Completed").length,
    };
  });
}

export async function getProjects(
  userId: string,
  query: ProjectListQuery,
): Promise<Paginated<Project>> {
  const { items, total } = await listProjects(userId, query);
  return {
    items: await withTaskCounts(items),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getProject(projectId: string, userId: string): Promise<Project> {
  const project = await assertProjectOwnership(projectId, userId);
  const [withCounts] = await withTaskCounts([project]);
  return withCounts ?? project;
}

export async function createProject(userId: string, input: ProjectWrite): Promise<Project> {
  return insertProject(userId, emptyToNull(input));
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: ProjectWrite,
): Promise<Project> {
  await assertProjectOwnership(projectId, userId);
  return updateProjectById(projectId, emptyToNull(input));
}

export async function deleteProject(projectId: string, userId: string): Promise<void> {
  await assertProjectOwnership(projectId, userId);
  await deleteProjectById(projectId);
}
