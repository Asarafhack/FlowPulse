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
import { projectStatusClass, taskPriorityClass, taskStatusClass, statusDotClass } from "@/lib/status-colors";

export const Route = createFileRoute("/projects/$projectId")({
  component: Detail,
});

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

function Detail() {
  const { projectId } = Route.useParams();

  const projectQuery = useProject(projectId);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");

  const [editing, setEditing] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "Pending",
    dueDate: "",
  });

  const taskQuery = useTasks({
    projectId,
    search,
    status,
    priority,
    limit: 100,
  });

  const create = useCreateTask();
  const update = useUpdateTask();
  const del = useDeleteTask();

  /* --------------------------------
     RESET FORM
  -------------------------------- */

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      priority: "Medium",
      status: "Pending",
      dueDate: "",
    });
  };

  /* --------------------------------
     OPEN CREATE TASK
  -------------------------------- */

  const openCreateTask = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  /* --------------------------------
     OPEN EDIT TASK
  -------------------------------- */

  const openEditTask = (task: Task) => {
    setEditing(task);

    setForm({
      title: task.name ?? "",
      description: task.description ?? "",
      priority: task.priority ?? "Medium",
      status: task.status ?? "Pending",
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : "",
    });

    setOpen(true);
  };

  /* --------------------------------
     CLOSE MODAL
  -------------------------------- */

  const closeModal = () => {
    if (create.isPending || update.isPending) return;

    setOpen(false);
    setEditing(null);
    resetForm();
  };

  /* --------------------------------
     SAVE TASK
  -------------------------------- */

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();

    if (!title) {
      alert("Task name is required.");
      return;
    }

    try {
      const input = {
        projectId,
        name: title,
        description: form.description.trim() || null,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
      };

      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          input,
        });
      } else {
        await create.mutateAsync(input);
      }

      closeModal();
    } catch (error) {
      alert(errorMessage(error));
    }
  };

  /* --------------------------------
     MARK COMPLETED / PENDING
  -------------------------------- */

  const toggleCompleted = async (task: Task) => {
    try {
      await update.mutateAsync({
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

  /* --------------------------------
     DELETE TASK
  -------------------------------- */

  const deleteTask = async (taskId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) return;

    try {
      await del.mutateAsync(taskId);
    } catch (error) {
      alert(errorMessage(error));
    }
  };

  /* --------------------------------
     PROJECT LOADING
  -------------------------------- */

  if (projectQuery.isLoading) {
    return (
      <Protected>
        <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
          Loading project...
        </div>
      </Protected>
    );
  }

  /* --------------------------------
     PROJECT ERROR
  -------------------------------- */

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <Protected>
        <div className="space-y-4">
          <Link
            to="/projects"
            className="text-sm font-medium underline"
          >
            ← Back to projects
          </Link>

          <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-center text-red-700">
            <p className="font-semibold">
              Project not found or access denied.
            </p>
          </div>
        </div>
      </Protected>
    );
  }

  const project = projectQuery.data;

  const taskData = taskQuery.data as
    | { items?: Task[] }
    | Task[]
    | undefined;

  const tasks = Array.isArray(taskData)
    ? taskData
    : taskData?.items ?? [];

  return (
    <Protected>
      <div className="space-y-6">

        {/* --------------------------------
            BACK TO PROJECTS
        -------------------------------- */}

        <Link
          to="/projects"
          className="inline-flex text-sm font-medium text-slate-700 underline hover:text-slate-900"
        >
          ← Back to projects
        </Link>

        {/* --------------------------------
            PROJECT INFORMATION
        -------------------------------- */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {project.name}
              </h1>

              <p className="mt-2 text-slate-500">
                {project.description ||
                  "No description provided."}
              </p>
            </div>

            <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${projectStatusClass(project.status)}`}>
              {project.status}
            </span>
          </div>

          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <span className="text-slate-500">
                Start
              </span>

              <div className="font-medium text-slate-900">
                {project.startDate || "—"}
              </div>
            </div>

            <div>
              <span className="text-slate-500">
                End
              </span>

              <div className="font-medium text-slate-900">
                {project.endDate || "—"}
              </div>
            </div>

            <div>
              <span className="text-slate-500">
                Created
              </span>

              <div className="font-medium text-slate-900">
                {project.createdAt
                  ? new Date(
                      project.createdAt,
                    ).toLocaleDateString()
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* --------------------------------
            TASK SECTION HEADER
        -------------------------------- */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Tasks
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create and manage tasks for this project.
              </p>
            </div>

            {/* MAIN ADD TASK BUTTON */}

            <button
              type="button"
              onClick={openCreateTask}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              + Add Task
            </button>

          </div>

          {/* --------------------------------
              SEARCH AND FILTER
          -------------------------------- */}

          <div className="mt-5 flex flex-col gap-3 md:flex-row">

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search tasks..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="rounded-lg border border-slate-300 px-3 py-2.5"
            >
              <option value="ALL">
                All statuses
              </option>

              {taskStatuses.map(
                ([value, label]) => (
                  <option
                    value={value}
                    key={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>

            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value)
              }
              className="rounded-lg border border-slate-300 px-3 py-2.5"
            >
              <option value="ALL">
                All priorities
              </option>

              {taskPriorities.map(
                ([value, label]) => (
                  <option
                    value={value}
                    key={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>

          </div>
        </div>

        {/* --------------------------------
            TASK LIST
        -------------------------------- */}

        {taskQuery.isLoading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
            Loading tasks...
          </div>
        ) : taskQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">
              Unable to load tasks.
            </p>

            <button
              type="button"
              onClick={() => taskQuery.refetch()}
              className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm"
            >
              Try again
            </button>
          </div>
        ) : tasks.length === 0 ? (

          /* --------------------------------
             NO TASKS
          -------------------------------- */

          <div className="rounded-xl border bg-white p-12 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
              ✓
            </div>

            <h3 className="mt-4 text-xl font-bold text-slate-900">
              No tasks yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              This project does not have any tasks.
              Create your first task to start tracking
              the work.
            </p>

            <button
              type="button"
              onClick={openCreateTask}
              className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + Create Your First Task
            </button>

          </div>

        ) : (

          /* --------------------------------
             TASK TABLE
          -------------------------------- */

          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-5 py-3">
                      Task
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3">
                      Priority
                    </th>

                    <th className="px-5 py-3">
                      Due Date
                    </th>

                    <th className="px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >

                      {/* TASK */}

                      <td className="px-5 py-4">

                        <div
                          className={
                            task.status ===
                            "Completed"
                              ? "font-medium text-slate-400 line-through"
                              : "font-medium text-slate-900"
                          }
                        >
                          {task.name}
                        </div>

                        <div className="mt-1 max-w-md truncate text-xs text-slate-500">
                          {task.description ||
                            "No description"}
                        </div>

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            toggleCompleted(task)
                          }
                          disabled={update.isPending}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition hover:opacity-80 disabled:opacity-50 ${taskStatusClass(task.status)}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(task.status)}`} />
                          {task.status}
                        </button>
                      </td>

                      {/* PRIORITY */}

                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${taskPriorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>

                      {/* DUE DATE */}

                      <td className="px-5 py-4 text-slate-500">
                        {task.dueDate
                          ? task.dueDate.substring(
                              0,
                              10,
                            )
                          : "—"}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            openEditTask(task)
                          }
                          className="mr-4 underline hover:text-slate-600"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteTask(task.id)
                          }
                          disabled={del.isPending}
                          className="text-red-600 underline hover:text-red-700 disabled:opacity-50"
                        >
                          Delete
                        </button>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          </div>
        )}

        {/* --------------------------------
            CREATE / EDIT TASK MODAL
        -------------------------------- */}

        {open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >

            <form
              onSubmit={save}
              className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-2xl"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="flex items-start justify-between">

                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editing
                      ? "Edit Task"
                      : "Create Task"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {editing
                      ? "Update this task."
                      : "Add a new task to this project."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-3 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ×
                </button>

              </div>

              {/* TASK NAME */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Task Name
                </label>

                <input
                  required
                  autoFocus
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title: event.target.value,
                    })
                  }
                  placeholder="Enter task name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target.value,
                    })
                  }
                  placeholder="Enter task description"
                  className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* PRIORITY + STATUS */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Priority
                  </label>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priority:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  >
                    {taskPriorities.map(
                      ([value, label]) => (
                        <option
                          value={value}
                          key={value}
                        >
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  >
                    {taskStatuses.map(
                      ([value, label]) => (
                        <option
                          value={value}
                          key={value}
                        >
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

              </div>

              {/* DUE DATE */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Due Date
                </label>

                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      dueDate: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t pt-4">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={
                    create.isPending ||
                    update.isPending
                  }
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    create.isPending ||
                    update.isPending
                  }
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {create.isPending ||
                  update.isPending
                    ? "Creating..."
                    : editing
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