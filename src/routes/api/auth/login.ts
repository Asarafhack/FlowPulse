import { createFileRoute } from "@tanstack/react-router";

import { clientIp, handleRequest, ok, readJson } from "@/api/http";
import { enforceRateLimit } from "@/api/security/rate-limit";
import { loginUser } from "@/api/services/auth.service";
import { loginSchema, parseOrThrow } from "@/api/validation/schemas";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        handleRequest(request, async () => {
          enforceRateLimit("login", clientIp(request));
          const body = await readJson(request);
          const input = parseOrThrow(loginSchema, body);
          const result = await loginUser(input);
          return ok(result);
        }),
    },
  },
});
