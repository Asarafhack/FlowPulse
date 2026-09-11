import { z } from "zod";

import { validationFailed, type FieldError } from "../errors";

export const PROJECT_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
] as const;

export const TASK_STATUSES = [
  "Pending",
  "In Progress",
  "Completed",
] as const;

export const TASK_PRIORITIES = [
  "Low",
  "Medium",
  "High",
] as const;

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use the YYYY-MM-DD format")
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "Date is not a valid calendar date",
  );

const optionalDate = z
  .union([isoDate, z.literal(""), z.null()])
  .optional();

const optionalText = z
  .union([z.string().trim().max(2000), z.null()])
  .optional();

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(120),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(255),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(255),

  password: z
    .string()
    .min(1, "Password is required")
    .max(72),
});

const projectBase = {
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(150),

  description: optionalText,

  status: z
    .enum(PROJECT_STATUSES)
    .optional(),

  startDate: optionalDate,

  endDate: optionalDate,
};

const withDateOrder = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine(
    (
      value: {
        startDate?: unknown;
        endDate?: unknown;
      },
      ctx,
    ) => {
      const { startDate, endDate } = value;

      if (
        typeof startDate === "string" &&
        typeof endDate === "string" &&
        startDate &&
        endDate
      ) {
        if (Date.parse(startDate) > Date.parse(endDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endDate"],
            message: "End date must be on or after the start date",
          });
        }
      }
    },
  );

export const createProjectSchema = withDateOrder(
  z.object(projectBase),
);

export const updateProjectSchema = withDateOrder(
  z.object({
    ...projectBase,
    name: projectBase.name.optional(),
  }),
);

export const createTaskSchema = z.object({
  projectId: z
    .string()
    .uuid("A valid project must be selected"),

  name: z
    .string()
    .trim()
    .min(1, "Task name is required")
    .max(150),

  description: optionalText,

  priority: z
    .enum(TASK_PRIORITIES)
    .optional(),

  status: z
    .enum(TASK_STATUSES)
    .optional(),

  dueDate: optionalDate,
});

export const updateTaskSchema = z.object({
  projectId: z
    .string()
    .uuid("A valid project must be selected")
    .optional(),

  name: z
    .string()
    .trim()
    .min(1, "Task name is required")
    .max(150)
    .optional(),

  description: optionalText,

  priority: z
    .enum(TASK_PRIORITIES)
    .optional(),

  status: z
    .enum(TASK_STATUSES)
    .optional(),

  dueDate: optionalDate,
});

const pagination = {
  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(10_000)
    .optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional(),
};

export const projectQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(150)
    .optional(),

  status: z
    .enum(PROJECT_STATUSES)
    .optional(),

  sortBy: z
    .enum([
      "createdAt",
      "name",
      "status",
      "startDate",
      "endDate",
    ])
    .optional(),

  sortOrder: z
    .enum(["asc", "desc"])
    .optional(),

  ...pagination,
});

export const taskQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(150)
    .optional(),

  status: z
    .enum(TASK_STATUSES)
    .optional(),

  priority: z
    .enum(TASK_PRIORITIES)
    .optional(),

  projectId: z
    .string()
    .uuid()
    .optional(),

  sortBy: z
    .enum([
      "createdAt",
      "name",
      "dueDate",
      "priority",
      "status",
    ])
    .optional(),

  sortOrder: z
    .enum(["asc", "desc"])
    .optional(),

  ...pagination,
});

export const idSchema = z.string().uuid("Invalid identifier");

export function parseOrThrow<T>(
  schema: z.ZodType<T>,
  input: unknown,
): T {
  const result = schema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  const errors: FieldError[] = result.error.issues.map((issue) => ({
    field: issue.path.join(".") || "request",
    message: issue.message,
  }));

  throw validationFailed(errors);
}

export function queryParams(
  request: Request,
): Record<string, string> {
  const params: Record<string, string> = {};

  new URL(request.url).searchParams.forEach((value, key) => {
    if (value !== "") {
      params[key] = value;
    }
  });

  return params;
}