import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  private prisma = new PrismaClient();

  // Get all roles with their permissions
  async findAll() {
    return this.prisma.role.findMany({
      include: { permissions: true },
    });
  }

  // Get one role by ID
  async findOne(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
  }

  // Create a role with optional permissions
  async create(dto: CreateRoleDto) {
    const data: Prisma.RoleCreateInput = {
      name: dto.name,
      permissions: dto.permissions?.length
        ? {
            // Flatten actions array into multiple RolePermission rows
            create: dto.permissions.flatMap((p) =>
              p.action.map((action) => ({
                resource: p.resource,
                action,
              })),
            ),
          }
        : undefined,
    };

    return this.prisma.role.create({
      data,
      include: { permissions: true },
    });
  }

  // Update a role and optionally replace permissions
  async update(id: string, dto: UpdateRoleDto) {
    const data: Prisma.RoleUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;

    if (dto.permissions) {
      data.permissions = {
        deleteMany: {}, // remove all existing permissions
        create: dto.permissions.flatMap((p) =>
          p.action.map((action) => ({
            resource: p.resource,
            action,
          })),
        ),
      };
    }

    return this.prisma.role.update({
      where: { id },
      data,
      include: { permissions: true },
    });
  }

  // Delete a role and cascade delete permissions
  async delete(id: string) {
    return this.prisma.role.delete({
      where: { id },
      include: { permissions: true },
    });
  }
}
