import { createFileRoute } from "@tanstack/react-router";

import { handleRequest, ok } from "@/api/http";
import { logger } from "@/api/logger";
import { authenticate } from "@/api/middleware/authenticate";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        handleRequest(request, async () => {
          const user = await authenticate(request);
          logger.info("user_logged_out", { userId: user.id });
          // Stateless JWT: the client discards the token; the server confirms the
          // caller was authenticated so logout cannot be triggered anonymously.
          return ok({ message: "Logged out" });
        }),
    },
  },
});
