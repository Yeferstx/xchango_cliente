import { Router, Routes } from '@angular/router';

import { inject } from '@angular/core';
import { PaginaNoDisponible } from './pages/pagina-no-disponible/pagina-no-disponible';
import { Login } from './pages/login/login';
import { HomeComponent } from './pages/home/home';
import { ModalDetalleTruequeComponent } from './layout/modal-detalle-trueque/modal-detalle-trueque';
import { PerfilComponent } from './pages/perfil/perfil';
import { InformacionComponent } from './pages/informacion/informacion';
import { VerificarCuentaComponent } from './pages/verificar-cuenta/verificar-cuenta';
import { LegalInfo } from './pages/legal-info/legal-info';
import { formulario_crear_truequesComponent } from './pages/formulario-crear-trueques/formulario-crear-trueques';
import { formulario_crear_usuarioComponent } from './pages/formulario-crear-usuario/formulario-crear-usuario';
import { LoginAdministracion } from './pages/login-administracion/login-administracion';
import { AdminLayout } from './pages/admin/admin-layout/admin-layout';
import { Administracion } from './pages/admin/administracion/administracion';
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { Moderacion } from './pages/admin/moderacion/moderacion';
import { Ranking } from './pages/admin/ranking/ranking';    
import { Reportes } from './pages/admin/reportes/reportes';
import { Usuarios } from './pages/admin/usuarios/usuarios';
import { adminAuthGuard, adminInvitadoGuard } from './guards/admin-auth-guard';
import { FormularioEditarTruequeComponent } from './pages/formulario-editar-trueque/formulario-editar-trueque';
import { DatosCuentaComponent } from './pages/datos_cuenta/datos_cuenta';
import { UbicacionComponent } from './pages/ubicacion/ubicacion';
import { MisPublicacionesComponent } from './pages/mis_publicaciones/mis_publicaciones';
import { MisTruequesComponent } from './pages/mis_trueques/mis_trueques';
import { NotificacionesComponent } from './pages/notificaciones/notificaciones';
import { AccesoComponent } from './pages/acceso/acceso';
import { authGuard } from './guards/auth.guard';
import { soloAdminGuard } from './guards/solo-admin.guard';
import { DocumentosComponent } from './pages/admin/documentos/documentos';
import { FormularioCrearUsuarioAdminComponent } from './pages/admin/formulario-crear-usuario-admin/formulario-crear-usuario-admin';

export const routes: Routes = [

  // ruta inicial
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // login
  {
    path: 'login',
    component: Login
  },
  {
    // formulario de correo y contraseña
    path: 'acceso',
    component: AccesoComponent
  },

  // home
  {
    path: 'home',
    component: HomeComponent
  },

  // trueques
  {
    path: 'trueque/:id',
    component: ModalDetalleTruequeComponent
  },

  {
    path: 'trueque',
    component: formulario_crear_truequesComponent,
    canActivate: [authGuard]
  },

  // crear usuario
  {
    path: 'formulario',
    component: formulario_crear_usuarioComponent
  },
  {
    path: 'trueque/:id/editar',
    component: FormularioEditarTruequeComponent,
    canActivate: [authGuard]
  },
  { path: 'editar', redirectTo: 'mis-publicaciones', pathMatch: 'full' },

  // perfil > datos de tu cuenta
{
  path: 'perfil/cuenta',
  component: DatosCuentaComponent,
    canActivate: [authGuard]
},

// perfil > ubicacion
{
  path: 'perfil/ubicacion',
  component: UbicacionComponent,
    canActivate: [authGuard]
},
// mis publicaciones
{
  path: 'mis-publicaciones',
  component: MisPublicacionesComponent,
    canActivate: [authGuard]
},

  // informacion legal
  {
    path: 'legal-info',
    component: LegalInfo
  },

  // perfil
  {
    path: 'perfil',
    component: PerfilComponent,
    canActivate: [authGuard]
  },

  // perfil > informacion
  {
    path: 'perfil/informacion',
    component: InformacionComponent,
    canActivate: [authGuard]
  },

  // perfil > verificar mi cuenta
  {
    path: 'perfil/verificacion',
    component: VerificarCuentaComponent,
    canActivate: [authGuard]
  },

  // PERFIL > SEGURIDAD (la pantalla era de muestra y no guardaba nada)
  { path: 'perfil/seguridad', component: PaginaNoDisponible, canActivate: [authGuard], data: { titulo: 'Seguridad de la cuenta', mensaje: 'Los ajustes de tu cuenta están disponibles en Datos de tu cuenta.', destino: '/perfil/cuenta', accion: 'Ir a Datos de tu cuenta' } },

  // administracion
  {
    path: 'admin/login',
    component: LoginAdministracion,
    canActivate: [adminInvitadoGuard],
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'reportes', component: Reportes },
      { path: 'administracion', component: Administracion },
      // crear moderadores: solo el administrador entra aqui
      { path: 'crear-usuario', component: FormularioCrearUsuarioAdminComponent, canActivate: [soloAdminGuard] },
      { path: 'documentos', component: DocumentosComponent },
      { path: 'usuarios', component: Usuarios },
      { path: 'moderacion', component: Moderacion },
      { path: 'ranking', component: Ranking },
    ],
  },

  // trueques y avisos del usuario
  {
    path: 'mis-trueques',
    component: MisTruequesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'notificaciones',
    component: NotificacionesComponent,
    canActivate: [authGuard]
  },

  // ALIAS: cierran enlaces que antes no resolvian
  { path: 'explorar', redirectTo: 'home', pathMatch: 'full' },
  { path: 'servicios', redirectTo: () => inject(Router).createUrlTree(['/home'], { queryParams: { filtro: 'servicios' } }), pathMatch: 'full' },
  { path: 'favoritos', redirectTo: () => inject(Router).createUrlTree(['/home'], { queryParams: { filtro: 'favoritos' } }), pathMatch: 'full' },
  { path: 'publicar', redirectTo: 'trueque', pathMatch: 'full' },
  { path: 'mensajes', component: PaginaNoDisponible, data: { titulo: 'Conversaciones por WhatsApp', mensaje: 'Puedes contactar por WhatsApp desde una publicación o desde un trueque aceptado.', destino: '/mis-trueques', accion: 'Ir a Mis trueques' } },
  { path: 'perfil/privacidad', redirectTo: () => inject(Router).createUrlTree(['/legal-info'], { queryParams: { seccion: 'privacidad', desde: 'perfil' } }), pathMatch: 'full' },

  // ruta no encontrada
  {
    path: '**',
    component: PaginaNoDisponible
  }
];