import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client'; // Atau enum Role Anda
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true; // No roles defined, access granted
    }
    const { user } = context.switchToHttp().getRequest();
    
    // Check if user object exists and has a role property
    if (!user || !user.role) {
      return false; // User not found or role not set, access denied
    }
    
    return requiredRoles.some((role) => user.role === role);
  }
}
