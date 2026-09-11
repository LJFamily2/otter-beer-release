import {
  Schema,
  model,
  models,
  Types,
  type Document,
  type Model,
} from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  image?: string;
  roleId: Types.ObjectId;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    image: { type: String, trim: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    // Revokes access without deleting the user (keeps audit trail on
    // BlogPost.createdBy / updatedBy intact).
    isActive: { type: Boolean, required: true, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const UserModel: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>("User", UserSchema);
