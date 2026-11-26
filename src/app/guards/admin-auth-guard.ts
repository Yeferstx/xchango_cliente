import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminsAdminService } from '../services/admin/admins-admin.service';

// bloquea /admin si no hay sesion y guarda a donde queria entrar
export const adminAuthGuard: CanActivateFn = (ruta, state) => {
  const auth = inject(AdminsAdminService);
  const router = inject(Router);

  if (auth.autenticado()) {
    return true;
  }

  return router.createUrlTree(['/admin/login'], { queryParams: { redirigir: state.url } });
};

// evita que un admin ya logueado vuelva a ver el login
export const adminInvitadoGuard: CanActivateFn = () => {
  const auth = inject(AdminsAdminService);
  const router = inject(Router);

  if (auth.autenticado()) {
    return router.createUrlTree(['/admin/dashboard']);
  }
  return true;
};
