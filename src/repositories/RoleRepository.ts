import { RoleModel, type IRole } from "@/models/Role";
import { BaseRepository } from "./BaseRepository";

export class RoleRepository extends BaseRepository<IRole> {
  constructor() {
    super(RoleModel);
  }

  async findByKey(key: string): Promise<IRole | null> {
    return this.findOne({ key: key.trim().toLowerCase() });
  }

  async listAll(): Promise<IRole[]> {
    const model = await this.ready();
    return model.find().sort({ isSystem: -1, name: 1 }).exec();
  }
}
