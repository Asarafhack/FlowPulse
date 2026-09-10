import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Protected } from "@/components/layout/protected";
import {
  useProject,
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "@/lib/queries";
import type { Task } from "@/lib/types";
import { errorMessage } from "@/lib/api-client";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectDetailsPage,
});

const taskStatuses = ["Pending", "In Progress", "Completed"] as const;
const taskPriorities = ["Low", "Medium", "High"] as const;

type TaskStatusValue = (typeof taskStatuses)[number];
type TaskPriorityValue = (typeof taskPriorities)[number];

function ProjectDetailsPage() {
  const { projectId } = Route.useParams();

  const projectQuery = useProject(projectId);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const taskQuery = useTasks({
    projectId,
    search: search || undefined,
    status: statusFilter,
    priority: priorityFilter,
  });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [taskForm, setTaskForm] = useState({
    name: "",
    description: "",
    priority: "Medium" as TaskPriorityValue,
    status: "Pending" as TaskStatusValue,
    dueDate: "",
  });

  /*
   * Convert API date into the format required by <input type="date">
   */
  const formatDateForInput = (value?: string | null) => {
    if (!value) return "";

    return value.includes("T")
      ? value.substring(0, 10)
      : value.substring(0, 10);
  };

  /*
   * Convert HTML date input:
   *
   * 2026-09-18
   *
   * into ISO datetime:
   *
   * 2026-09-17T18:30:00.000Z
   *
   * This is important because the backend stores due_date as a timestamp.
   */
  const toIsoDate = (value: string) => {
    if (!value) return null;

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  };

  const openCreateTask = () => {
    setEditingTask(null);

    setTaskForm({
      name: "",
      description: "",
      priority: "Medium",
      status: "Pending",
      dueDate: "",
    });

    setTaskDialogOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);

    setTaskForm({
      name: task.name ?? "",
      description: task.description ?? "",
      priority: (task.priority ?? "Medium") as TaskPriorityValue,
      status: (task.status ?? "Pending") as TaskStatusValue,
      dueDate: formatDateForInput(task.dueDate),
    });

    setTaskDialogOpen(true);
  };

  const closeTaskDialog = () => {
    if (createTask.isPending || updateTask.isPending) {
      return;
    }

    setTaskDialogOpen(false);
    setEditingTask(null);

    setTaskForm({
      name: "",
      description: "",
      priority: "Medium",
      status: "Pending",
      dueDate: "",
    });
  };

  const saveTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = taskForm.name.trim();
    const description = taskForm.description.trim();

    if (!name) {
      alert("Task name is required.");
      return;
    }

    try {
      /*
       * IMPORTANT:
       * Backend expects "name", not "title".
       *
       * Backend also expects dueDate as an ISO datetime.
       */
      const input = {
        name,
        description: description || null,
        priority: taskForm.priority,
        status: taskForm.status,
        dueDate: toIsoDate(taskForm.dueDate),
      };

      if (editingTask) {
        await updateTask.mutateAsync({
          id: editingTask.id,
          input,
        });
      } else {
        await createTask.mutateAsync({
          ...input,
          projectId,
        });
      }

      closeTaskDialog();
    } catch (error) {
      alert(errorMessage(error));
    }
  };

  const toggleCompleted = async (task: Task) => {
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

  const handleDeleteTask = async (task: Task) => {
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

  /*
   * API can return either:
   *
   *   [...]
   *
   * or:
   *
   *   { items: [...] }
   */
  const taskResponse = taskQuery.data;

  const tasks: Task[] = Array.isArray(taskResponse)
    ? taskResponse
    : Array.isArray((taskResponse as any)?.items)
      ? (taskResponse as any).items
      : [];

  if (projectQuery.isLoading) {
    return (
      <Protected>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-xl border bg-white px-8 py-6 text-sm text-slate-500 shadow-sm">
            Loading project...
          </div>
        </div>
      </Protected>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <Protected>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Project not found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              We couldn't load this project. It may have been
              deleted or you may not have access to it.
            </p>

            <Link
              to="/projects"
              className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      </Protected>
    );
  }

  const project = projectQuery.data;

  return (
    <Protected>
      <div className="space-y-6">
        {/* -------------------------------------------------
            HEADER
        ------------------------------------------------- */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              to="/projects"
              className="mb-3 inline-flex items-center text-sm text-slate-500 hover:text-slate-900"
            >
              ← Back to Projects
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {project.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage project information and tasks.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateTask}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Add Task
          </button>
        </div>

        {/* -------------------------------------------------
            PROJECT INFORMATION
        ------------------------------------------------- */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Status
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {project.status}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Start Date
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {project.startDate || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                End Date
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {project.endDate || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Created
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {project.createdAt
                  ? new Date(project.createdAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>

          {project.description && (
            <div className="mt-6 border-t pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Description
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {project.description}
              </p>
            </div>
          )}
        </div>

        {/* -------------------------------------------------
            TASKS
        ------------------------------------------------- */}
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="border-b p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Project Tasks
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {tasks.length} task
                  {tasks.length === 1 ? "" : "s"} in this project
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search tasks..."
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">
                    In Progress
                  </option>
                  <option value="Completed">Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(event.target.value)
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Task loading */}
          {taskQuery.isLoading && (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading tasks...
            </div>
          )}

          {/* Task error */}
          {taskQuery.isError && (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-red-600">
                Unable to load tasks.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {errorMessage(taskQuery.error)}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!taskQuery.isLoading &&
            !taskQuery.isError &&
            tasks.length === 0 && (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                  ✓
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  No tasks found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Create your first task for this project.
                </p>

                <button
                  type="button"
                  onClick={openCreateTask}
                  className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  + Add Task
                </button>
              </div>
            )}

          {/* Task table */}
          {!taskQuery.isLoading &&
            !taskQuery.isError &&
            tasks.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Task
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Priority
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Due Date
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {tasks.map((task) => (
                      <tr
                        key={task.id}
                        className="border-b last:border-b-0 hover:bg-slate-50/70"
                      >
                        {/* Task */}
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={task.status === "Completed"}
                              onChange={() =>
                                toggleCompleted(task)
                              }
                              disabled={updateTask.isPending}
                              className="mt-1 h-4 w-4 rounded border-slate-300"
                            />

                            <div className="min-w-0">
                              <p
                                className={`text-sm font-semibold ${
                                  task.status === "Completed"
                                    ? "text-slate-400 line-through"
                                    : "text-slate-900"
                                }`}
                              >
                                {task.name}
                              </p>

                              {task.description && (
                                <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              task.priority === "High"
                                ? "bg-red-50 text-red-700"
                                : task.priority === "Medium"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              task.status === "Completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : task.status === "In Progress"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {task.dueDate
                            ? new Date(
                                task.dueDate,
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditTask(task)
                              }
                              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteTask(task)
                              }
                              disabled={deleteTask.isPending}
                              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {/* -------------------------------------------------
            TASK CREATE / EDIT MODAL
        ------------------------------------------------- */}
        {taskDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
              <div className="border-b px-6 py-5">
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingTask ? "Edit Task" : "New Task"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingTask
                    ? "Update the task details."
                    : "Add task details for this project."}
                </p>
              </div>

              <form onSubmit={saveTask}>
                <div className="space-y-5 px-6 py-6">
                  {/* Task Name */}
                  <div>
                    <label
                      htmlFor="task-name"
                      className="mb-2 block text-sm font-semibold text-slate-900"
                    >
                      Task Name
                    </label>

                    <input
                      id="task-name"
                      type="text"
                      value={taskForm.name}
                      onChange={(event) =>
                        setTaskForm((previous) => ({
                          ...previous,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Enter task name"
                      maxLength={200}
                      required
                      className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="task-description"
                      className="mb-2 block text-sm font-semibold text-slate-900"
                    >
                      Description
                    </label>

                    <textarea
                      id="task-description"
                      value={taskForm.description}
                      onChange={(event) =>
                        setTaskForm((previous) => ({
                          ...previous,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Describe this task..."
                      rows={4}
                      className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  {/* Priority + Status */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="task-priority"
                        className="mb-2 block text-sm font-semibold text-slate-900"
                      >
                        Priority
                      </label>

                      <select
                        id="task-priority"
                        value={taskForm.priority}
                        onChange={(event) =>
                          setTaskForm((previous) => ({
                            ...previous,
                            priority:
                              event.target.value as TaskPriorityValue,
                          }))
                        }
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      >
                        {taskPriorities.map((priority) => (
                          <option
                            key={priority}
                            value={priority}
                          >
                            {priority}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="task-status"
                        className="mb-2 block text-sm font-semibold text-slate-900"
                      >
                        Status
                      </label>

                      <select
                        id="task-status"
                        value={taskForm.status}
                        onChange={(event) =>
                          setTaskForm((previous) => ({
                            ...previous,
                            status:
                              event.target.value as TaskStatusValue,
                          }))
                        }
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      >
                        {taskStatuses.map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label
                      htmlFor="task-due-date"
                      className="mb-2 block text-sm font-semibold text-slate-900"
                    >
                      Due Date
                    </label>

                    <input
                      id="task-due-date"
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(event) =>
                        setTaskForm((previous) => ({
                          ...previous,
                          dueDate: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                </div>

                {/* Modal footer */}
                <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">
                  <button
                    type="button"
                    onClick={closeTaskDialog}
                    disabled={
                      createTask.isPending ||
                      updateTask.isPending
                    }
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      createTask.isPending ||
                      updateTask.isPending
                    }
                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createTask.isPending ||
                    updateTask.isPending
                      ? "Saving..."
                      : editingTask
                        ? "Update Task"
                        : "Save Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Protected>
  );
}