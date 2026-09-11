import { Types } from "mongoose";
import { UserRepository } from "@/repositories/UserRepository";
import { RoleRepository } from "@/repositories/RoleRepository";
import { canManageRole } from "@/config/roles";
import { permissionService } from "@/services/PermissionService";
import type { IUser } from "@/models/User";

export class UserMutationError extends Error {}

const HIERARCHY_ERROR = "You cannot grant a role at or above your own rank.";

export class UserService {
  constructor(
    private readonly userRepository: UserRepository = new UserRepository(),
    private readonly roleRepository: RoleRepository = new RoleRepository()
  ) {}

  async list(): Promise<IUser[]> {
    return this.userRepository.listAllWithRole();
  }

  /**
   * Adds an email to the login allowlist with an assigned role. actorLevel
   * gates which role can be granted (see config/roles.ts's canManageRole()).
   * New users automatically inherit their assigned role's default permissions.
   */
  async invite(
    email: string,
    name: string,
    roleId: string,
    actorLevel: number
  ): Promise<IUser> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new UserMutationError(`${normalizedEmail} already has access`);
    }
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new UserMutationError("Role not found");
    }
    if (!canManageRole(actorLevel, role.level)) {
      throw new UserMutationError(HIERARCHY_ERROR);
    }
    return this.userRepository.create({
      email: normalizedEmail,
      name,
      roleId: new Types.ObjectId(roleId),
      isActive: true,
    });
  }

  async updateRole(
    id: string,
    roleId: string,
    actorLevel: number
  ): Promise<IUser | null> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new UserMutationError("Role not found");
    }
    if (!canManageRole(actorLevel, role.level)) {
      throw new UserMutationError(HIERARCHY_ERROR);
    }
    return this.userRepository.updateById(id, { roleId });
  }

  /**
   * `isActive: false` revokes access without deleting the user.
   */
  async setActive(
    id: string,
    isActive: boolean,
    actorLevel: number
  ): Promise<IUser | null> {
    const user = await this.userRepository.findByIdWithRole(id);
    if (!user) return null;
    const role = user.roleId as unknown as { level: number };
    if (!canManageRole(actorLevel, role.level)) {
      throw new UserMutationError(
        "You cannot change access for a user whose role is at or above your own rank."
      );
    }
    return this.userRepository.updateById(id, { isActive });
  }

  async delete(id: string, actorLevel: number): Promise<boolean> {
    const user = await this.userRepository.findByIdWithRole(id);
    if (!user) return false;
    const role = user.roleId as unknown as { level: number };
    if (!canManageRole(actorLevel, role.level)) {
      throw new UserMutationError(
        "You cannot remove access for a user whose role is at or above your own rank."
      );
    }
    // Clean up any custom user overrides
    await permissionService.deleteForUser(id);
    const deleted = await this.userRepository.deleteById(id);
    return Boolean(deleted);
  }
}

export const userService = new UserService();
