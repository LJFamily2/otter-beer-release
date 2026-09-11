import { UserModel, type IUser } from "@/models/User";
import { BaseRepository } from "./BaseRepository";

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email: email.trim().toLowerCase() });
  }

  async findByEmailWithRole(email: string): Promise<IUser | null> {
    const model = await this.ready();
    return model
      .findOne({ email: email.trim().toLowerCase() })
      .populate("roleId")
      .exec();
  }

  async findByIdWithRole(id: string): Promise<IUser | null> {
    const model = await this.ready();
    return model.findById(id).populate("roleId").exec();
  }

  async touchLastLogin(id: string): Promise<void> {
    const model = await this.ready();
    await model.findByIdAndUpdate(id, { lastLoginAt: new Date() }).exec();
  }

  async listAllWithRole(): Promise<IUser[]> {
    const model = await this.ready();
    return model.find().populate("roleId").sort({ createdAt: -1 }).exec();
  }
}
