import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IRole extends Document {
  key: string;
  name: string;
  isSystem: boolean;
  /** Hierarchy rank — lower is more senior (super_admin=0, admin=1, office_member=2). A role can only be created/edited/deleted by an actor whose own level is strictly lower. See config/roles.ts's canManageRole(). */
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9_]+$/,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    // System roles (superAdmin/admin/officeMember) can't be deleted or
    // renamed away from their seeded key — see RoleService.
    isSystem: { type: Boolean, required: true, default: false },
    // Default is a deliberately low-privilege fallback for any role
    // document that predates this field (Mongoose applies schema defaults
    // on read for missing fields) — new roles always get an explicit,
    // server-computed level; this default is never relied on for those.
    level: { type: Number, required: true, default: 999 },
  },
  { timestamps: true }
);

export const RoleModel: Model<IRole> =
  (models.Role as Model<IRole>) || model<IRole>("Role", RoleSchema);
