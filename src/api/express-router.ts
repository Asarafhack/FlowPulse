import type { NextFunction, Request as ExpressRequest, Response, Router } from "express";
import { Router as createRouter } from "express";

import { AppError } from "@/api/errors";
import { clientIp } from "@/api/http";
import { authenticate } from "@/api/middleware/authenticate";
import { logger } from "@/api/logger";
import { openApiDocument } from "@/api/openapi";
import { enforceRateLimit } from "@/api/security/rate-limit";
import { registerUser, loginUser } from "@/api/services/auth.service";
import { getDashboardStats } from "@/api/services/dashboard.service";
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
} from "@/api/services/projects.service";
import { createTask, deleteTask, getTask, getTasks, updateTask } from "@/api/services/tasks.service";
import { projectListQuery, taskListQuery } from "@/api/validation/query";
import {
  createProjectSchema,
  createTaskSchema,
  idSchema,
  loginSchema,
  parseOrThrow,
  registerSchema,
  updateProjectSchema,
  updateTaskSchema,
} from "@/api/validation/schemas";
import { findUserById, toPublicUser } from "@/api/repositories/users.repository";

function webRequest(req: ExpressRequest): Request {
  const protocol = req.protocol || "http";
  const host = req.get("host") ?? "localhost";
  const headers = new Headers();
  const authorization = req.get("authorization");
  if (authorization) headers.set("authorization", authorization);
  const forwarded = req.get("x-forwarded-for");
  if (forwarded) headers.set("x-forwarded-for", forwarded);
  const cfIp = req.get("cf-connecting-ip");
  if (cfIp) headers.set("cf-connecting-ip", cfIp);
  return new Request(`${protocol}://${host}${req.originalUrl}`, { headers });
}

async function authUser(req: ExpressRequest) {
  return authenticate(webRequest(req));
}

function sendOk(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ success: true, data });
}

function asyncRoute(
  handler: (req: ExpressRequest, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: ExpressRequest, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function createApiRouter(): Router {
  const router = createRouter();

  router.get("/health", (_req, res) => sendOk(res, { status: "ok" }));
  router.get("/openapi.json", (_req, res) => res.json(openApiDocument));

  router.post(
    "/auth/register",
    asyncRoute(async (req, res) => {
      enforceRateLimit("register", req.ip || clientIp(webRequest(req)));
      const input = parseOrThrow(registerSchema, req.body);
      return sendOk(res, await registerUser(input), 201);
    }),
  );

  router.post(
    "/auth/login",
    asyncRoute(async (req, res) => {
      enforceRateLimit("login", req.ip || clientIp(webRequest(req)));
      const input = parseOrThrow(loginSchema, req.body);
      return sendOk(res, await loginUser(input));
    }),
  );

  router.post(
    "/auth/logout",
    asyncRoute(async (req, res) => {
      const user = await authUser(req);
      logger.info("user_logged_out", { userId: user.id });
      return sendOk(res, { message: "Logged out" });
    }),
  );

  router.get(
    "/auth/me",
    asyncRoute(async (req, res) => {
      const auth = await authUser(req);
      const record = await findUserById(auth.id);
      if (!record) throw new AppError(401, "Account no longer exists");
      return sendOk(res, { user: toPublicUser(record) });
    }),
  );

  router.get(
    "/dashboard/stats",
    asyncRoute(async (req, res) => sendOk(res, await getDashboardStats((await authUser(req)).id))),
  );

  router.get(
    "/projects",
    asyncRoute(async (req, res) => {
      const user = await authUser(req);
      return sendOk(res, await getProjects(user.id, projectListQuery(webRequest(req))));
    }),
  );

  router.post(
    "/projects",
    asyncRoute(async (req, res) => {
      const user = await authUser(req);
      const input = parseOrThrow(createProjectSchema, req.body);
      return sendOk(res, await createProject(user.id, input), 201);
    }),
  );

  router.get(
    "/projects/:id",
    asyncRoute(async (req, res) => {
      const user = await authUser(req);
      const id = parseOrThrow(idSchema, req.params.id);
      return sendOk(res, await getProject(id, user.id));
    }),
  );

  router.put(
    "/projects/:id",
    asyncRoute(async (req, res) => {
      const user = await authUser(req);
      const id = parseOrThrow(idSchema, req.params.id);
      const input = parseOrThrow(updateProjectSchema, req.body);
      return sendOk(res, await updateProject(id, user.id, input));
    }),
  );

  router.delete(
    "/projects/:id",
    asyncRoute(async (req, res) => {
      const user = await authUser(req);
      const id = parseOrThrow(idSchema, req.params.id);
      await deleteProject(id, user.id);
      return sendOk(res, { message: "Project deleted" });
    }),
  );

  router.get(
    "/tasks",
    asyncRoute(async (req, res) => {
      const user = await authUser(req);
      return sendOk(res, await getTasks(user.id, taskListQuery(webRequest(req))));
    }),
  );

  router.post(
    "/tasks",
    asyncRoute(async (req, res) => {
      const user = await authUser(req);
      const input = parseOrThrow(createTaskSchema, req.body);
      return sendOk(res, await createTask(user.id, input), 201);
    }),
  );

  router.get(
    "/tasks/:id",
    asyncRoute(async (req, res) => {
      const user = await authUser(req);
      const id = parseOrThrow(idSchema, req.params.id);
      return sendOk(res, await getTask(id, user.id));
    }),
  );

  router.put(
    "/tasks/:id",
    asyncRoute(async (req, res) => {
      const user = await authUser(req);
      const id = parseOrThrow(idSchema, req.params.id);
      const input = parseOrThrow(updateTaskSchema, req.body);
      return sendOk(res, await updateTask(id, user.id, input));
    }),
  );

  router.delete(
    "/tasks/:id",
    asyncRoute(async (req, res) => {
      const user = await authUser(req);
      const id = parseOrThrow(idSchema, req.params.id);
      await deleteTask(id, user.id);
      return sendOk(res, { message: "Task deleted" });
    }),
  );

  return router;
}
