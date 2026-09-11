import {
  Schema,
  model,
  models,
  Types,
  type Document,
  type Model,
} from "mongoose";
import { PERMISSION_ACTIONS, type ActionGrant } from "@/config/permissions";

export interface IPermission extends Document {
  roleId?: Types.ObjectId;
  userId?: Types.ObjectId;
  moduleKey: string;
  actions: ActionGrant;
  createdAt: Date;
  updatedAt: Date;
}

const ActionGrantSchema = new Schema<ActionGrant>(
  {
    [PERMISSION_ACTIONS.ACCESS]: { type: Boolean, required: true, default: false },
    [PERMISSION_ACTIONS.VIEW]: { type: Boolean, required: true, default: false },
    [PERMISSION_ACTIONS.ADD]: { type: Boolean, required: true, default: false },
    [PERMISSION_ACTIONS.EDIT]: { type: Boolean, required: true, default: false },
    [PERMISSION_ACTIONS.DELETE]: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const PermissionSchema = new Schema<IPermission>(
  {
    roleId: { type: Schema.Types.ObjectId, ref: "Role" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    moduleKey: { type: String, required: true, trim: true },
    actions: { type: ActionGrantSchema, required: true, default: () => ({}) },
  },
  { timestamps: true }
);

// Exactly one of roleId or userId must be specified
PermissionSchema.pre("validate", function () {
  if ((!this.roleId && !this.userId) || (this.roleId && this.userId)) {
    throw new Error("Permission document must have exactly one of roleId or userId.");
  }
});

// Indexes for fast lookup & uniqueness
PermissionSchema.index(
  { roleId: 1, moduleKey: 1 },
  { unique: true, partialFilterExpression: { roleId: { $exists: true } } }
);

PermissionSchema.index(
  { userId: 1, moduleKey: 1 },
  { unique: true, partialFilterExpression: { userId: { $exists: true } } }
);

// Ensure Next.js HMR re-compiles the schema if cached Mongoose model is stale
if (models.Permission && !models.Permission.schema.paths.userId) {
  delete (models as Record<string, unknown>).Permission;
}

export const PermissionModel: Model<IPermission> =
  (models.Permission as Model<IPermission>) ||
  model<IPermission>("Permission", PermissionSchema);
