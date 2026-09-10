import { createFileRoute } from "@tanstack/react-router";

import { handleRequest, ok, readJson } from "@/api/http";
import { authenticate } from "@/api/middleware/authenticate";
import { deleteProject, getProject, updateProject } from "@/api/services/projects.service";
import { idSchema, parseOrThrow, updateProjectSchema } from "@/api/validation/schemas";

export const Route = createFileRoute("/api/projects/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) =>
        handleRequest(request, async () => {
          const user = await authenticate(request);
          const id = parseOrThrow(idSchema, params.id);
          return ok(await getProject(id, user.id));
        }),
      PUT: async ({ request, params }) =>
        handleRequest(request, async () => {
          const user = await authenticate(request);
          const id = parseOrThrow(idSchema, params.id);
          const input = parseOrThrow(updateProjectSchema, await readJson(request));
          return ok(await updateProject(id, user.id, input));
        }),
      DELETE: async ({ request, params }) =>
        handleRequest(request, async () => {
          const user = await authenticate(request);
          const id = parseOrThrow(idSchema, params.id);
          await deleteProject(id, user.id);
          return ok({ message: "Project deleted" });
        }),
    },
  },
});
