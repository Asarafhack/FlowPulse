import { createFileRoute } from "@tanstack/react-router";

import { handleRequest, ok } from "@/api/http";
import { authenticate } from "@/api/middleware/authenticate";
import { findUserById, toPublicUser } from "@/api/repositories/users.repository";
import { unauthorized } from "@/api/errors";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        handleRequest(request, async () => {
          const auth = await authenticate(request);
          const record = await findUserById(auth.id);
          if (!record) throw unauthorized("Account no longer exists");
          return ok({ user: toPublicUser(record) });
        }),
    },
  },
});
