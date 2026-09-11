import { Types } from "mongoose";
import { PermissionModel, type IPermission } from "@/models/Permission";
import type { ActionGrant } from "@/config/permissions";
import { BaseRepository } from "./BaseRepository";

function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

export class PermissionRepository extends BaseRepository<IPermission> {
  constructor() {
    super(PermissionModel);
  }

  async findByRole(roleId: string | Types.ObjectId): Promise<IPermission[]> {
    return this.find({ roleId: toObjectId(roleId) });
  }

  async findByUser(userId: string | Types.ObjectId): Promise<IPermission[]> {
    return this.find({ userId: toObjectId(userId) });
  }

  async findByRoleAndModule(
    roleId: string | Types.ObjectId,
    moduleKey: string
  ): Promise<IPermission | null> {
    return this.findOne({ roleId: toObjectId(roleId), moduleKey });
  }

  async findByUserAndModule(
    userId: string | Types.ObjectId,
    moduleKey: string
  ): Promise<IPermission | null> {
    return this.findOne({ userId: toObjectId(userId), moduleKey });
  }

  /** Creates or overwrites the default action grant for one (role, module) matrix cell. */
  async upsertRoleGrant(
    roleId: string | Types.ObjectId,
    moduleKey: string,
    actions: ActionGrant
  ): Promise<IPermission> {
    const model = await this.ready();
    const roleObjId = toObjectId(roleId);
    return model
      .findOneAndUpdate(
        { roleId: roleObjId, moduleKey },
        { $set: { roleId: roleObjId, moduleKey, actions } },
        { returnDocument: "after", upsert: true, runValidators: true }
      )
      .exec();
  }

  /** Creates or overwrites a custom override action grant for one (user, module) matrix cell. */
  async upsertUserGrant(
    userId: string | Types.ObjectId,
    moduleKey: string,
    actions: ActionGrant
  ): Promise<IPermission> {
    const model = await this.ready();
    const userObjId = toObjectId(userId);
    return model
      .findOneAndUpdate(
        { userId: userObjId, moduleKey },
        { $set: { userId: userObjId, moduleKey, actions } },
        { returnDocument: "after", upsert: true, runValidators: true }
      )
      .exec();
  }

  async deleteByRole(roleId: string | Types.ObjectId): Promise<void> {
    const model = await this.ready();
    await model.deleteMany({ roleId: toObjectId(roleId) }).exec();
  }

  async deleteByUser(userId: string | Types.ObjectId): Promise<void> {
    const model = await this.ready();
    await model.deleteMany({ userId: toObjectId(userId) }).exec();
  }
}
