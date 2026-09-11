import "dotenv/config";

import cors from "cors";
import express, {
type NextFunction,
type Request,
type Response,
} from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";

import { AppError } from "@/api/errors";
import { logger } from "@/api/logger";
import { createApiRouter } from "@/api/express-router";

const app = express();

const port = Number(process.env["PORT"] ?? process.env["API_PORT"] ?? 3001);

const allowedOrigins = (process.env["CORS_ORIGIN"] ?? "")
.split(",")
.map((origin) => origin.trim())
.filter(Boolean);

app.disable("x-powered-by");

app.use(helmet());

app.use(
cors({
origin: (origin, callback) => {
if (
!origin ||
allowedOrigins.length === 0 ||
allowedOrigins.includes(origin)
) {
callback(null, true);
return;
}


  callback(new Error("Origin is not allowed by CORS"));
},


}),
);

app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
const requestId = randomUUID();
const started = Date.now();

res.setHeader("x-request-id", requestId);

res.on("finish", () => {
logger.info("http_request", {
requestId,
method: req.method,
path: req.path,
status: res.statusCode,
durationMs: Date.now() - started,
});
});

next();
});

app.use("/api", createApiRouter());

app.use((_req, res) => {
res.status(404).json({
success: false,
message: "API route not found",
});
});

app.use(
(
error: unknown,
_req: Request,
res: Response,
_next: NextFunction,
) => {
if (error instanceof AppError) {
res.status(error.status).json({
success: false,
message: error.message,
...(error.errors ? { errors: error.errors } : {}),
});
return;
}


logger.error("http_unhandled_error", {
  message: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});

res.status(500).json({
  success: false,
  message: "Internal server error",
});


},
);

app.listen(port, () => {
logger.info("express_api_started", { port });
});

