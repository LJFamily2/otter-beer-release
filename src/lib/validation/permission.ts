import { z } from "zod";
import { MODULE_KEYS_LIST } from "@/config/permissions";

const moduleKeyEnum = z.enum(
  MODULE_KEYS_LIST as unknown as [string, ...string[]]
);

const actionGrantSchema = z.object({
  access: z.boolean(),
  view: z.boolean(),
  add: z.boolean(),
  edit: z.boolean(),
  delete: z.boolean(),
});

const grantItemSchema = z.object({
  moduleKey: moduleKeyEnum,
  actions: actionGrantSchema,
});

export const UpdatePermissionMatrixSchema = z
  .object({
    roleId: z.string().trim().min(1).optional(),
    userId: z.string().trim().min(1).optional(),
    grants: z.array(grantItemSchema).min(1),
  })
  .refine((data) => (data.roleId && !data.userId) || (!data.roleId && data.userId), {
    message: "Must specify exactly one of roleId or userId",
  });

export type UpdatePermissionMatrixInput = z.infer<
  typeof UpdatePermissionMatrixSchema
>;
