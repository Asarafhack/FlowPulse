import { createFileRoute } from "@tanstack/react-router";

import { openApiDocument } from "@/api/openapi";

export const Route = createFileRoute("/api/openapi.json")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify(openApiDocument), {
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
    },
  },
});
