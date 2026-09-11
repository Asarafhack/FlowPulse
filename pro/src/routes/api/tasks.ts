import { createFileRoute } from "@tanstack/react-router";

import { handleRequest, ok, readJson } from "@/api/http";
import { authenticate } from "@/api/middleware/authenticate";
import { createTask, getTasks } from "@/api/services/tasks.service";
import { taskListQuery } from "@/api/validation/query";
import { createTaskSchema, parseOrThrow } from "@/api/validation/schemas";

export const Route = createFileRoute("/api/tasks")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        handleRequest(request, async () => {
          const user = await authenticate(request);
          return ok(await getTasks(user.id, taskListQuery(request)));
        }),
      POST: async ({ request }) =>
        handleRequest(request, async () => {
          const user = await authenticate(request);
          const input = parseOrThrow(createTaskSchema, await readJson(request));
          return ok(await createTask(user.id, input), 201);
        }),
    },
  },
});
