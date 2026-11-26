import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TruequesService } from '../services/trueques';

// si no hay sesion lo manda a /acceso y guarda a donde iba
export const authGuard: CanActivateFn = (ruta, estado) => {
  const servicio = inject(TruequesService);
  const router = inject(Router);

  servicio.cargar();

  if (servicio.autenticado()) {
    return true;
  }

  return router.createUrlTree(['/acceso'], {
    queryParams: { volverA: estado.url },
  });
};
