import { z } from "zod";

export const InviteUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1).max(150),
  roleId: z.string().trim().min(1),
});

export const UpdateUserSchema = z
  .object({
    roleId: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.roleId !== undefined || data.isActive !== undefined, {
    message: "Provide at least one of roleId or isActive",
  });

export type InviteUserInput = z.infer<typeof InviteUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
