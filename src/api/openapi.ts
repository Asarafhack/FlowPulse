const bearer = [{ bearerAuth: [] }];

const project = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    name: { type: "string" },
    description: { type: "string", nullable: true },
    status: { type: "string", enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] },
    startDate: { type: "string", format: "date", nullable: true },
    endDate: { type: "string", format: "date", nullable: true },
    taskCount: { type: "integer" },
    completedTaskCount: { type: "integer" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

const task = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    projectId: { type: "string", format: "uuid" },
    name: { type: "string" },
    description: { type: "string", nullable: true },
    priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
    status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
    dueDate: { type: "string", format: "date", nullable: true },
    projectName: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

function listResponse(items: unknown) {
  return {
    "200": {
      description: "Paginated collection",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  items: { type: "array", items },
                  pagination: {
                    type: "object",
                    properties: {
                      page: { type: "integer" },
                      limit: { type: "integer" },
                      total: { type: "integer" },
                      totalPages: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

const idParam = [
  { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
];

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "FlowPulse API",
    version: "1.0.0",
    description:
      "REST API for the FlowPulse project management system. Authentication uses JWT bearer tokens issued by the login and register endpoints. Every project and task endpoint is scoped to the authenticated owner.",
  },
  servers: [{ url: "/", description: "Current deployment" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Project: project,
      Task: task,
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: { field: { type: "string" }, message: { type: "string" } },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Create an account and receive a JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fullName", "email", "password"],
                properties: {
                  fullName: { type: "string", minLength: 2 },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Account created; returns user and token" },
          "409": { description: "Email already registered" },
          "422": { description: "Validation failed" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Exchange credentials for a JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Authenticated; returns user and token" },
          "401": { description: "Invalid email or password" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Invalidate the client session",
        security: bearer,
        responses: { "200": { description: "Logged out" } },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Return the authenticated user profile",
        security: bearer,
        responses: { "200": { description: "Profile" }, "401": { description: "Unauthenticated" } },
      },
    },
    "/api/projects": {
      get: {
        tags: ["Projects"],
        summary: "List the authenticated user's projects",
        security: bearer,
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] },
          },
          { name: "sortBy", in: "query", schema: { type: "string" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: listResponse({ $ref: "#/components/schemas/Project" }),
      },
      post: {
        tags: ["Projects"],
        summary: "Create a project",
        security: bearer,
        responses: { "201": { description: "Created" }, "422": { description: "Validation failed" } },
      },
    },
    "/api/projects/{id}": {
      get: {
        tags: ["Projects"],
        summary: "Get one owned project",
        security: bearer,
        parameters: idParam,
        responses: {
          "200": { description: "Project" },
          "403": { description: "Not the owner" },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["Projects"],
        summary: "Update one owned project",
        security: bearer,
        parameters: idParam,
        responses: { "200": { description: "Updated" }, "403": { description: "Not the owner" } },
      },
      delete: {
        tags: ["Projects"],
        summary: "Delete one owned project and its tasks",
        security: bearer,
        parameters: idParam,
        responses: { "200": { description: "Deleted" }, "403": { description: "Not the owner" } },
      },
    },
    "/api/tasks": {
      get: {
        tags: ["Tasks"],
        summary: "List tasks across the authenticated user's projects",
        security: bearer,
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
          },
          {
            name: "priority",
            in: "query",
            schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
          },
          { name: "projectId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: listResponse({ $ref: "#/components/schemas/Task" }),
      },
      post: {
        tags: ["Tasks"],
        summary: "Create a task inside an owned project",
        security: bearer,
        responses: { "201": { description: "Created" }, "403": { description: "Not the owner" } },
      },
    },
    "/api/tasks/{id}": {
      get: {
        tags: ["Tasks"],
        summary: "Get one task from an owned project",
        security: bearer,
        parameters: idParam,
        responses: { "200": { description: "Task" }, "403": { description: "Not the owner" } },
      },
      put: {
        tags: ["Tasks"],
        summary: "Update a task (including marking it completed)",
        security: bearer,
        parameters: idParam,
        responses: { "200": { description: "Updated" }, "403": { description: "Not the owner" } },
      },
      delete: {
        tags: ["Tasks"],
        summary: "Delete a task from an owned project",
        security: bearer,
        parameters: idParam,
        responses: { "200": { description: "Deleted" }, "403": { description: "Not the owner" } },
      },
    },
    "/api/dashboard/stats": {
      get: {
        tags: ["Dashboard"],
        summary: "Aggregated project and task statistics for the authenticated user",
        security: bearer,
        responses: { "200": { description: "Statistics" } },
      },
    },
  },
} as const;
