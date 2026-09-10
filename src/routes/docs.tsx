import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Protected } from "@/components/layout/protected";

type Operation = { summary?: string; description?: string; security?: unknown };
type OpenApiSpec = { paths?: Record<string, Record<string, Operation>> };

export const Route = createFileRoute("/docs")({ component: Docs });

function Docs() {
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    fetch(new URL("/api/openapi.json", base))
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load API specification.");
        return response.json() as Promise<OpenApiSpec>;
      })
      .then(setSpec)
      .catch(() => setError("Unable to load the live OpenAPI specification."));
  }, []);

  return (
    <Protected>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="mt-1 text-sm text-slate-500">
            Live documentation generated from the Express API OpenAPI contract.
          </p>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}
        {!spec && !error && <div className="rounded-xl border bg-white p-10">Loading API specification…</div>}

        {spec && (
          <div className="space-y-3">
            {Object.entries(spec.paths ?? {}).map(([path, operations]) => (
              <div className="rounded-xl border bg-white p-5" key={path}>
                <div className="mb-3 font-mono font-semibold">{path}</div>
                <div className="space-y-2">
                  {Object.entries(operations).map(([method, operation]) => (
                    <div className="rounded-lg bg-slate-50 p-3" key={method}>
                      <div className="flex flex-wrap gap-3">
                        <span className="font-mono text-xs font-bold uppercase">{method}</span>
                        <span className="font-medium">
                          {operation.summary ?? operation.description ?? "Endpoint"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Protected>
  );
}
