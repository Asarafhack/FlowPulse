import { countProjectsByStatus, listProjectIds } from "../repositories/projects.repository";
import { listTaskFactsForProjects } from "../repositories/tasks.repository";
import type { DashboardStats } from "@/lib/types";

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [projectIds, projectsByStatus] = await Promise.all([
    listProjectIds(userId),
    countProjectsByStatus(userId),
  ]);
  const tasks = await listTaskFactsForProjects(projectIds);
  const today = new Date().toISOString().slice(0, 10);

  return {
    totalProjects: projectIds.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => task.status === "COMPLETED").length,
    pendingTasks: tasks.filter((task) => task.status === "PENDING").length,
    inProgressTasks: tasks.filter((task) => task.status === "IN_PROGRESS").length,
    projectsInProgress: projectsByStatus.IN_PROGRESS,
    projectsByStatus,
    tasksByPriority: {
      LOW: tasks.filter((task) => task.priority === "LOW").length,
      MEDIUM: tasks.filter((task) => task.priority === "MEDIUM").length,
      HIGH: tasks.filter((task) => task.priority === "HIGH").length,
    },
    overdueTasks: tasks.filter(
      (task) => task.status !== "COMPLETED" && task.dueDate !== null && task.dueDate < today,
    ).length,
  };
}
