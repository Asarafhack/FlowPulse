import { createFileRoute } from "@tanstack/react-router";

import { handleRequest, ok, readJson } from "@/api/http";
import { authenticate } from "@/api/middleware/authenticate";
import { deleteTask, getTask, updateTask } from "@/api/services/tasks.service";
import { idSchema, parseOrThrow, updateTaskSchema } from "@/api/validation/schemas";

export const Route = createFileRoute("/api/tasks/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) =>
        handleRequest(request, async () => {
          const user = await authenticate(request);
          const id = parseOrThrow(idSchema, params.id);
          return ok(await getTask(id, user.id));
        }),
      PUT: async ({ request, params }) =>
        handleRequest(request, async () => {
          const user = await authenticate(request);
          const id = parseOrThrow(idSchema, params.id);
          const input = parseOrThrow(updateTaskSchema, await readJson(request));
          return ok(await updateTask(id, user.id, input));
        }),
      DELETE: async ({ request, params }) =>
        handleRequest(request, async () => {
          const user = await authenticate(request);
          const id = parseOrThrow(idSchema, params.id);
          await deleteTask(id, user.id);
          return ok({ message: "Task deleted" });
        }),
    },
  },
});
