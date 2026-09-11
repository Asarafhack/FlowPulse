import { createFileRoute } from "@tanstack/react-router";

import { handleRequest, ok } from "@/api/http";
import { authenticate } from "@/api/middleware/authenticate";
import { getDashboardStats } from "@/api/services/dashboard.service";

export const Route = createFileRoute("/api/dashboard/stats")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        handleRequest(request, async () => {
          const user = await authenticate(request);
          return ok(await getDashboardStats(user.id));
        }),
    },
  },
});
