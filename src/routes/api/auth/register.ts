import { createFileRoute } from "@tanstack/react-router";

import { clientIp, handleRequest, ok, readJson } from "@/api/http";
import { enforceRateLimit } from "@/api/security/rate-limit";
import { registerUser } from "@/api/services/auth.service";
import { parseOrThrow, registerSchema } from "@/api/validation/schemas";

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        handleRequest(request, async () => {
          enforceRateLimit("register", clientIp(request));
          const body = await readJson(request);
          const input = parseOrThrow(registerSchema, body);
          const result = await registerUser(input);
          return ok(result, 201);
        }),
    },
  },
});
