import { createFileRoute } from "@tanstack/react-router";

import { handleRequest, ok, readJson } from "@/api/http";
import { authenticate } from "@/api/middleware/authenticate";
import { createProject, getProjects } from "@/api/services/projects.service";
import { projectListQuery } from "@/api/validation/query";
import { createProjectSchema, parseOrThrow } from "@/api/validation/schemas";

export const Route = createFileRoute("/api/projects")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        handleRequest(request, async () => {
          const user = await authenticate(request);
          return ok(await getProjects(user.id, projectListQuery(request)));
        }),
      POST: async ({ request }) =>
        handleRequest(request, async () => {
          const user = await authenticate(request);
          const input = parseOrThrow(createProjectSchema, await readJson(request));
          return ok(await createProject(user.id, input), 201);
        }),
    },
  },
});
