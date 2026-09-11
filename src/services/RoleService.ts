import { RoleRepository } from "@/repositories/RoleRepository";
import { permissionService } from "@/services/PermissionService";
import { canManageRole } from "@/config/roles";
import type { IRole } from "@/models/Role";

export class RoleMutationError extends Error {}

const HIERARCHY_ERROR =
  "You cannot manage a role at or above your own rank.";

export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository = new RoleRepository()
  ) {}

  async list(): Promise<IRole[]> {
    return this.roleRepository.listAll();
  }

  async create(key: string, name: string, actorLevel: number): Promise<IRole> {
    const normalizedKey = key.trim().toLowerCase();
    const existing = await this.roleRepository.findByKey(normalizedKey);
    if (existing) {
      throw new RoleMutationError(`Role key "${normalizedKey}" already exists`);
    }
    return this.roleRepository.create({
      key: normalizedKey,
      name,
      isSystem: false,
      level: actorLevel + 1,
    } as Partial<IRole>);
  }

  async rename(id: string, name: string, actorLevel: number): Promise<IRole | null> {
    const role = await this.roleRepository.findById(id);
    if (!role) return null;
    if (!canManageRole(actorLevel, role.level)) {
      throw new RoleMutationError(HIERARCHY_ERROR);
    }
    return this.roleRepository.updateById(id, { name });
  }

  async delete(id: string, actorLevel: number): Promise<void> {
    const role = await this.roleRepository.findById(id);
    if (!role) return;
    if (role.isSystem) {
      throw new RoleMutationError(
        "System roles (superAdmin/admin/officeMember) cannot be deleted"
      );
    }
    if (!canManageRole(actorLevel, role.level)) {
      throw new RoleMutationError(HIERARCHY_ERROR);
    }
    await permissionService.deleteForRole(id);
    await this.roleRepository.deleteById(id);
  }
}

export const roleService = new RoleService();
