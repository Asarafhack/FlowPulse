import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Protected } from "@/components/layout/protected";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "@/lib/queries";
import { errorMessage } from "@/lib/api-client";
import type { Project } from "@/lib/types";

export const Route = createFileRoute("/projects")({
  component: Projects,
});

const projectStatuses = [
  ["Not Started", "Not Started"],
  ["In Progress", "In Progress"],
  ["Completed", "Completed"],
] as const;

const taskStatuses = [
  ["Pending", "Pending"],
  ["In Progress", "In Progress"],
  ["Completed", "Completed"],
] as const;

const taskPriorities = [
  ["Low", "Low"],
  ["Medium", "Medium"],
  ["High", "High"],
] as const;

type TaskForm = {
  name: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
};

const emptyTaskForm: TaskForm = {
  name: "",
  description: "",
  priority: "Medium",
  status: "Pending",
  dueDate: "",
};

function Projects() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Project | null>(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    status: "Not Started",
    startDate: "",
    endDate: "",
  });

  const projectsQuery = useProjects({
    search,
    status,
    page,
    limit: 8,
  });

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [taskProjectId, setTaskProjectId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const [taskForm, setTaskForm] = useState<TaskForm>({
    ...emptyTaskForm,
  });

  const items = projectsQuery.data?.items ?? [];
  const total = projectsQuery.data?.pagination?.total ?? 0;
  const totalPages = projectsQuery.data?.pagination?.totalPages ?? 1;

  /* =========================================================
     PROJECT FUNCTIONS
  ========================================================= */

  const openCreateProject = () => {
    setEditing(null);

    setProjectForm({
      name: "",
      description: "",
      status: "Not Started",
      startDate: "",
      endDate: "",
    });

    setProjectDialogOpen(true);
  };

  const openEditProject = (project: Project) => {
    setEditing(project);

    setProjectForm({
      name: project.name,
      description: project.description ?? "",
      status: project.status,
      startDate: project.startDate
        ? project.startDate.substring(0, 10)
        : "",
      endDate: project.endDate
        ? project.endDate.substring(0, 10)
        : "",
    });

    setProjectDialogOpen(true);
  };

  const closeProjectDialog = () => {
    if (createProject.isPending || updateProject.isPending) {
      return;
    }

    setProjectDialogOpen(false);
    setEditing(null);
  };

  const saveProject = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const name = projectForm.name.trim();

    if (!name) {
      alert("Project name is required.");
      return;
    }

    if (
      projectForm.startDate &&
      projectForm.endDate &&
      projectForm.startDate > projectForm.endDate
    ) {
      alert("End date must be on or after start date.");
      return;
    }

    try {
      const input = {
        name,
        description: projectForm.description.trim() || null,
        status: projectForm.status,
        startDate: projectForm.startDate || null,
        endDate: projectForm.endDate || null,
      };

      if (editing) {
        await updateProject.mutateAsync({
          id: editing.id,
          input,
        });
      } else {
        await createProject.mutateAsync(input);
      }

      closeProjectDialog();
    } catch (error) {
      alert(errorMessage(error));
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = window.confirm(
      "Delete this project and all its tasks?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject.mutateAsync(projectId);
    } catch (error) {
      alert(errorMessage(error));
    }
  };

  /* =========================================================
     TASK FUNCTIONS
  ========================================================= */

  const openCreateTask = (projectId: string) => {
    setTaskProjectId(projectId);
    setEditingTask(null);

    setTaskForm({
      ...emptyTaskForm,
    });

    setTaskDialogOpen(true);
  };

  const openEditTask = (projectId: string, task: any) => {
    setTaskProjectId(projectId);
    setEditingTask(task);

    setTaskForm({
      name: task.name ?? "",
      description: task.description ?? "",
      priority: task.priority ?? "Medium",
      status: task.status ?? "Pending",
      dueDate: task.dueDate
        ? task.dueDate.substring(0, 10)
        : "",
    });

    setTaskDialogOpen(true);
  };

  const closeTaskDialog = () => {
    if (createTask.isPending || updateTask.isPending) {
      return;
    }

    setTaskDialogOpen(false);
    setTaskProjectId(null);
    setEditingTask(null);
    setTaskForm({
      ...emptyTaskForm,
    });
  };

  const saveTask = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!taskProjectId) {
      alert("Project is required.");
      return;
    }

    const name = taskForm.name.trim();

    if (!name) {
      alert("Task name is required.");
      return;
    }

    try {
      /*
       * IMPORTANT:
       * Backend expects `name`, not `title`.
       *
       * Keep the UI values as:
       * Pending / In Progress / Completed
       * Low / Medium / High
       */
      const input = {
        projectId: taskProjectId,
        name,
        description: taskForm.description.trim() || null,
        priority: taskForm.priority,
        status: taskForm.status,
        dueDate: taskForm.dueDate || null,
      };

      if (editingTask) {
        await updateTask.mutateAsync({
          id: editingTask.id,
          input: {
            name,
            description: taskForm.description.trim() || null,
            priority: taskForm.priority,
            status: taskForm.status,
            dueDate: taskForm.dueDate || null,
          },
        });
      } else {
        await createTask.mutateAsync(input);
      }

      closeTaskDialog();
    } catch (error) {
      alert(errorMessage(error));
    }
  };

  const handleDeleteTask = async (task: any) => {
    const confirmed = window.confirm(
      `Delete task "${task.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteTask.mutateAsync(task.id);
    } catch (error) {
      alert(errorMessage(error));
    }
  };

  const toggleTaskCompleted = async (task: any) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        input: {
          status:
            task.status === "Completed"
              ? "Pending"
              : "Completed",
        },
      });
    } catch (error) {
      alert(errorMessage(error));
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Protected>
      <div className="space-y-6">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Projects
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create, track and manage your work.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateProject}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + New project
          </button>
        </div>

        {/* ===================================================
            SEARCH / FILTER
        =================================================== */}

        <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search projects..."
            className="flex-1 rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-300"
          />

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="ALL">ALL</option>

            {projectStatuses.map(([value, label]) => (
              <option
                value={value}
                key={value}
              >
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* ===================================================
            LOADING
        =================================================== */}

        {projectsQuery.isLoading && (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
            Loading projects...
          </div>
        )}

        {/* ===================================================
            ERROR
        =================================================== */}

        {projectsQuery.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">
              Unable to load projects.
            </p>

            <button
              type="button"
              onClick={() => projectsQuery.refetch()}
              className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {/* ===================================================
            EMPTY
        =================================================== */}

        {!projectsQuery.isLoading &&
          !projectsQuery.isError &&
          items.length === 0 && (
            <div className="rounded-xl border bg-white p-12 text-center">
              <h3 className="font-semibold">
                No projects yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create your first project to get started.
              </p>

              <button
                type="button"
                onClick={openCreateProject}
                className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                + Create project
              </button>
            </div>
          )}

        {/* ===================================================
            PROJECTS
        =================================================== */}

        {!projectsQuery.isLoading &&
          !projectsQuery.isError &&
          items.length > 0 && (
            <div className="space-y-5">
              {items.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEditProject={openEditProject}
                  onDeleteProject={handleDeleteProject}
                  onCreateTask={openCreateTask}
                  onEditTask={openEditTask}
                  onDeleteTask={handleDeleteTask}
                  onToggleTask={toggleTaskCompleted}
                />
              ))}

              {/* =================================================
                  PAGINATION
              ================================================= */}

              <div className="flex items-center justify-between rounded-xl border bg-white px-5 py-3 text-sm">
                <span className="text-slate-500">
                  {total}{" "}
                  {total === 1
                    ? "project"
                    : "projects"}
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage(
                        (current) => current - 1,
                      )
                    }
                    className="rounded border px-3 py-1.5 disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="flex items-center px-2 text-slate-500">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage(
                        (current) => current + 1,
                      )
                    }
                    className="rounded border px-3 py-1.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* ===================================================
            PROJECT MODAL
        =================================================== */}

        {projectDialogOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <form
              onSubmit={saveProject}
              className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div>
                <h2 className="text-xl font-bold">
                  {editing
                    ? "Edit project"
                    : "New project"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the project details below.
                </p>
              </div>

              {/* Project Name */}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Project Name
                </label>

                <input
                  required
                  value={projectForm.name}
                  placeholder="Project name"
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      name: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              {/* Description */}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={projectForm.description}
                  placeholder="Description"
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      description:
                        event.target.value,
                    })
                  }
                  className="min-h-24 w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              {/* Status */}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Status
                </label>

                <select
                  value={projectForm.status}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      status: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2.5"
                >
                  {projectStatuses.map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Dates */}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={projectForm.startDate}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        startDate:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={projectForm.endDate}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        endDate:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2.5"
                  />
                </div>
              </div>

              {projectForm.startDate &&
                projectForm.endDate &&
                projectForm.startDate >
                  projectForm.endDate && (
                  <p className="text-sm text-red-600">
                    End date must be on or after
                    start date.
                  </p>
                )}

              {/* Buttons */}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeProjectDialog}
                  className="rounded-lg border px-4 py-2"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createProject.isPending ||
                    updateProject.isPending ||
                    Boolean(
                      projectForm.startDate &&
                        projectForm.endDate &&
                        projectForm.startDate >
                          projectForm.endDate,
                    )
                  }
                  className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
                >
                  {createProject.isPending ||
                  updateProject.isPending
                    ? "Saving..."
                    : editing
                      ? "Save Changes"
                      : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================================================
            TASK MODAL
        =================================================== */}

        {taskDialogOpen && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4">
            <form
              onSubmit={saveTask}
              className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div>
                <h2 className="text-xl font-bold">
                  {editingTask
                    ? "Edit Task"
                    : "New Task"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add task details for this project.
                </p>
              </div>

              {/* Task Name */}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Task Name
                </label>

                <input
                  required
                  autoFocus
                  value={taskForm.name}
                  placeholder="Task name"
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      name: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              {/* Description */}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={taskForm.description}
                  placeholder="Task description"
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      description:
                        event.target.value,
                    })
                  }
                  className="min-h-24 w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              {/* Priority + Status */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Priority
                  </label>

                  <select
                    value={taskForm.priority}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        priority:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2.5"
                  >
                    {taskPriorities.map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Status
                  </label>

                  <select
                    value={taskForm.status}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        status:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2.5"
                  >
                    {taskStatuses.map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              {/* Due Date */}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Due Date
                </label>

                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      dueDate:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2.5"
                />
              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeTaskDialog}
                  disabled={
                    createTask.isPending ||
                    updateTask.isPending
                  }
                  className="rounded-lg border px-4 py-2 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createTask.isPending ||
                    updateTask.isPending
                  }
                  className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
                >
                  {createTask.isPending ||
                  updateTask.isPending
                    ? "Saving..."
                    : editingTask
                      ? "Save Changes"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Protected>
  );
}

/* ===========================================================
   PROJECT CARD
   Separate component so useTasks() is called legally per
   project instead of inside the .map() of Projects().
=========================================================== */

function ProjectCard({
  project,
  onEditProject,
  onDeleteProject,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onToggleTask,
}: {
  project: Project;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateTask: (projectId: string) => void;
  onEditTask: (projectId: string, task: any) => void;
  onDeleteTask: (task: any) => void;
  onToggleTask: (task: any) => void;
}) {
  const tasksQuery = useTasks({
    projectId: project.id,
  });

  const tasksResponse: any = tasksQuery.data;

  const tasks: any[] = Array.isArray(tasksResponse)
    ? tasksResponse
    : tasksResponse?.items ?? [];

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      {/* =====================================================
          PROJECT HEADER
      ===================================================== */}

      <div className="border-b p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              to="/projects/$projectId"
              params={{
                projectId: project.id,
              }}
              className="block w-fit"
            >
              <h2 className="text-lg font-bold text-slate-900 hover:text-blue-600 hover:underline">
                {project.name}
              </h2>
            </Link>

            <p className="mt-1 text-sm text-slate-500">
              {project.description ||
                "No description"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                {project.status}
              </span>

              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                Tasks: {project.completedTaskCount ?? 0}/
                {project.taskCount ?? 0}
              </span>

              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                {project.startDate || "No start date"}
                {" → "}
                {project.endDate || "No end date"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={() =>
                onEditProject(project)
              }
              className="text-sm text-slate-700 underline hover:text-slate-900"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() =>
                onDeleteProject(project.id)
              }
              className="text-sm text-red-600 underline hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          TASK SECTION
      ===================================================== */}

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              Project Tasks
            </h3>

            <p className="text-xs text-slate-500">
              Manage tasks without leaving this page.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onCreateTask(project.id)
            }
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            + Add Task
          </button>
        </div>

        {/* Task loading */}

        {tasksQuery.isLoading && (
          <div className="rounded-lg border bg-slate-50 p-6 text-center text-sm text-slate-500">
            Loading tasks...
          </div>
        )}

        {/* Task error */}

        {tasksQuery.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Unable to load tasks.

            <button
              type="button"
              onClick={() =>
                tasksQuery.refetch()
              }
              className="ml-3 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* No tasks */}

        {!tasksQuery.isLoading &&
          !tasksQuery.isError &&
          tasks.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium text-slate-700">
                No tasks yet
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Add the first task for this project.
              </p>

              <button
                type="button"
                onClick={() =>
                  onCreateTask(project.id)
                }
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                + Create Task
              </button>
            </div>
          )}

        {/* =================================================
            TASK LIST
        ================================================= */}

        {!tasksQuery.isLoading &&
          !tasksQuery.isError &&
          tasks.length > 0 && (
            <div className="space-y-3">
              {tasks.map((task) => {
                const completed =
                  task.status === "Completed";

                return (
                  <div
                    key={task.id}
                    className="rounded-lg border p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      {/* Task information */}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              onToggleTask(task)
                            }
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                              completed
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                            title={
                              completed
                                ? "Mark as pending"
                                : "Mark as completed"
                            }
                          >
                            {completed
                              ? "✓"
                              : ""}
                          </button>

                          <div className="min-w-0">
                            <p
                              className={`font-medium ${
                                completed
                                  ? "text-slate-400 line-through"
                                  : "text-slate-900"
                              }`}
                            >
                              {task.name}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-500">
                              {task.description ||
                                "No description"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Badges */}

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium">
                          {task.status}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            task.priority === "High"
                              ? "bg-red-100 text-red-700"
                              : task.priority ===
                                  "Medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {task.priority}
                        </span>

                        {task.dueDate && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                            Due:{" "}
                            {String(
                              task.dueDate,
                            ).substring(
                              0,
                              10,
                            )}
                          </span>
                        )}
                      </div>

                      {/* Actions */}

                      <div className="flex shrink-0 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            onEditTask(
                              project.id,
                              task,
                            )
                          }
                          className="text-xs text-slate-700 underline hover:text-slate-900"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDeleteTask(task)
                          }
                          className="text-xs text-red-600 underline hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}