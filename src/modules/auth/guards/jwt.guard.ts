import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleType } from '@/modules/users/user.schema';
import { RolesGuard } from './roles.guard';

export function JwtAuth(...roles: RoleType[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard('jwt'), RolesGuard),
  );
}
