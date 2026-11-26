import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminsAdminService } from '../services/admin/admins-admin.service';

// solo entra el administrador, el moderador se devuelve al panel
export const soloAdminGuard: CanActivateFn = () => {
  const admins = inject(AdminsAdminService);
  const router = inject(Router);

  if (admins.esAdministrador()) {
    return true;
  }

  return router.createUrlTree(['/admin/dashboard']);
};
