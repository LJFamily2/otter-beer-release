import { z } from "zod";

export const CreateRoleSchema = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Key must be lowercase snake_case"),
  name: z.string().trim().min(1).max(100),
});

export const UpdateRoleSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
