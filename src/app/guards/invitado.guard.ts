import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { TruequesService } from '../services/trueques';

// si ya tiene la sesion abierta no lo deja entrar a crear otra cuenta
export const invitadoGuard: CanActivateFn = () => {
  const servicio = inject(TruequesService);
  const router = inject(Router);

  servicio.cargar();

  if (servicio.autenticado()) {
    return router.createUrlTree(['/home']);
  }

  return true;
};
