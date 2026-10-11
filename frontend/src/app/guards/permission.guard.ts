import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const permissionGuard: CanActivateFn = (_route, state) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  if (permissionService.canAccessRoute(state.url)) {
    return true;
  }

  // If route is forbidden for current user, redirect to home
  router.navigate(['/']);
  return false;
};
