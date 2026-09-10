import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Protected } from "@/components/layout/protected";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/lib/queries";
import { errorMessage } from "@/lib/api-client";
import type { Project } from "@/lib/types";

export const Route = createFileRoute("/projects")({
  component: Projects,
});

const statuses = [
  ["Not Started", "Not Started"],
  ["In Progress", "In Progress"],
  ["Completed", "Completed"],
] as const;

function Projects() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Project | null>(null);
  const [open, setOpen] = useState(false);

  const q = useProjects({
    search,
    status,
    page,
    limit: 8,
  });

  const create = useCreateProject();
  const update = useUpdateProject();
  const del = useDeleteProject();

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Not Started",
    startDate: "",
    endDate: "",
  });

  const start = (project?: Project) => {
    setEditing(project ?? null);

    if (project) {
      setForm({
        name: project.name,
        description: project.description ?? "",
        status: project.status,
        startDate: project.startDate ?? "",
        endDate: project.endDate ?? "",
      });
    } else {
      setForm({
        name: "",
        description: "",
        status: "Not Started",
        startDate: "",
        endDate: "",
      });
    }

    setOpen(true);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      form.startDate &&
      form.endDate &&
      form.startDate > form.endDate
    ) {
      return;
    }

    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          input: form,
        });
      } else {
        await create.mutateAsync(form);
      }

      setOpen(false);
      setEditing(null);
    } catch (error) {
      alert(errorMessage(error));
    }
  };

  const handleDelete = async (projectId: string) => {
    const confirmed = window.confirm(
      "Delete this project and all its tasks?",
    );

    if (!confirmed) return;

    try {
      await del.mutateAsync(projectId);
    } catch (error) {
      alert(errorMessage(error));
    }
  };

  const items = q.data?.items ?? [];
  const total = q.data?.pagination?.total ?? 0;
  const totalPages = q.data?.pagination?.totalPages ?? 1;

  return (
    <Protected>
      <div className="space-y-6">
        {/* Header */}
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
            onClick={() => start()}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + New project
          </button>
        </div>

        {/* Search / Filter */}
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

            {statuses.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {q.isLoading && (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
            Loading projects...
          </div>
        )}

        {/* Error */}
        {q.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">
              Unable to load projects.
            </p>

            <button
              type="button"
              onClick={() => q.refetch()}
              className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!q.isLoading && !q.isError && items.length === 0 && (
          <div className="rounded-xl border bg-white p-12 text-center">
            <h3 className="font-semibold">
              No projects yet
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Create your first project to get started.
            </p>

            <button
              type="button"
              onClick={() => start()}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              + Create project
            </button>
          </div>
        )}

        {/* Projects Table */}
        {!q.isLoading &&
          !q.isError &&
          items.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="px-5 py-3">
                        Project
                      </th>

                      <th className="px-5 py-3">
                        Status
                      </th>

                      <th className="px-5 py-3">
                        Tasks
                      </th>

                      <th className="px-5 py-3">
                        Dates
                      </th>

                      <th className="px-5 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((project) => (
                      <tr
                        key={project.id}
                        className="border-b transition hover:bg-slate-50 last:border-0"
                      >
                        {/* PROJECT NAME */}
                        <td className="px-5 py-4">
                          <Link
                            to="/projects/$projectId"
                            params={{
                              projectId: project.id,
                            }}
                            className="block w-fit cursor-pointer"
                          >
                            <div className="font-semibold text-slate-900 hover:text-blue-600 hover:underline">
                              {project.name}
                            </div>

                            <div className="mt-1 max-w-md truncate text-xs text-slate-500">
                              {project.description ||
                                "No description"}
                            </div>
                          </Link>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium">
                            {project.status}
                          </span>
                        </td>

                        {/* TASK COUNT */}
                        <td className="px-5 py-4">
                          {project.completedTaskCount ?? 0}/
                          {project.taskCount ?? 0}
                        </td>

                        {/* DATES */}
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {project.startDate || "—"}{" "}
                          →{" "}
                          {project.endDate || "—"}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => start(project)}
                            className="mr-3 text-slate-700 underline hover:text-slate-900"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(project.id)
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

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
                <span className="text-slate-500">
                  {total}{" "}
                  {total === 1 ? "project" : "projects"}
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => current - 1)
                    }
                    className="rounded border px-3 py-1.5 disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) => current + 1)
                    }
                    className="rounded border px-3 py-1.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* CREATE / EDIT PROJECT MODAL */}
        {open && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <form
              onSubmit={save}
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

              {/* Name */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Project Name
                </label>

                <input
                  required
                  placeholder="Project name"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
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
                  placeholder="Description"
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
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
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {statuses.map(([value, label]) => (
                    <option
                      value={value}
                      key={value}
                    >
                      {label}
                    </option>
                  ))}
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
                    value={form.startDate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        startDate: event.target.value,
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
                    value={form.endDate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        endDate: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2.5"
                  />
                </div>
              </div>

              {/* Date validation */}
              {form.startDate &&
                form.endDate &&
                form.startDate > form.endDate && (
                  <p className="text-sm text-red-600">
                    End date must be on or after start date.
                  </p>
                )}

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setEditing(null);
                  }}
                  className="rounded-lg border px-4 py-2"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    create.isPending ||
                    update.isPending ||
                    Boolean(
                      form.startDate &&
                        form.endDate &&
                        form.startDate > form.endDate,
                    )
                  }
                  className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
                >
                  {create.isPending || update.isPending
                    ? "Saving..."
                    : editing
                      ? "Save Changes"
                      : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Protected>
  );
}