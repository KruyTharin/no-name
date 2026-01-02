import { PermissionDto } from '@/modules/role/dto/create-role.dto';
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (permissions: PermissionDto[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
