import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';

export function Auth() {
  return applyDecorators(UseGuards(AuthGuard('jwt'), RolesGuard));
}
