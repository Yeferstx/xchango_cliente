import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_URL, leerToken } from '../config/api';
import { AdminsAdminService } from '../services/admin/admins-admin.service';
import { TruequesService } from '../services/trueques';

// manda el token en cada peticion al MID y cierra la sesion si vence
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) {
    return next(req);
  }

  const esAdmin = req.url.startsWith(API_URL + '/admin');
  const token = leerToken(esAdmin);

  const peticion = token
    ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } })
    : req;

  const router = inject(Router);
  const admins = inject(AdminsAdminService);
  const trueques = inject(TruequesService);

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      const esLogin = req.url.includes('/auth/');

      if (error.status === 401 && token && !esLogin) {
        if (esAdmin) {
          admins.logout();
          router.navigate(['/admin/login']);
        } else {
          trueques.cerrarSesion();
        }
      }
      return throwError(() => error);
    }),
  );
};
