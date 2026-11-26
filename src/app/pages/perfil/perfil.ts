import { LogoXchangoComponent } from '../../components/logo-xchango/logo-xchango';
import { Component, OnInit, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { IconoComponent } from '../../components/icono/icono';
import { TruequesService } from '../../services/trueques';
import { nombreCompleto } from '../../models/usuario.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [LogoXchangoComponent, IconoComponent, CommonModule, RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class PerfilComponent implements OnInit {
  private servicio = inject(TruequesService);
  private router = inject(Router);

  // cuantas calificaciones hacen falta para mostrar el promedio
  totalCalificacionesRequeridas = 5;
  calificacionMaxima = 5;

  // true cuando ya llegaron los datos, asi no se ve "Invitado" ni datos viejos
  listo = signal(false);

  async ngOnInit(): Promise<void> {
    await this.servicio.esperarDatos();
    this.listo.set(true);
    // se piden otra vez los datos para que los contadores y la insignia salgan al dia
    await this.servicio.refrescar();
  }

  // datos del usuario en sesion
  // si no hay usuario se usa uno vacio para no repetir validaciones
  get usuario(): any {
    const usuario = this.servicio.usuarioActual();
    if (usuario) {
      return usuario;
    }
    return {};
  }

  get nombreUsuario(): string {
    const usuario = this.servicio.usuarioActual();
    if (usuario) {
      return nombreCompleto(usuario);
    }
    return 'Invitado';
  }

  get avatarUrl(): string {
    if (this.usuario.avatar) {
      return this.usuario.avatar;
    }
    return '/Logo-xchango/avatar-defecto.png';
  }

  get ubicacion(): string {
    if (this.usuario.ubicacion) {
      return this.usuario.ubicacion;
    }
    return 'Casanare';
  }

  get calificacion(): number {
    if (this.usuario.calificacion) {
      return this.usuario.calificacion;
    }
    return 0;
  }

  get totalCalificaciones(): number {
    if (this.usuario.totalCalificaciones) {
      return this.usuario.totalCalificaciones;
    }
    return 0;
  }

  // texto del perfil (HU21), si no ha escrito nada sale un texto de ayuda
  get descripcion(): string {
    if (this.usuario.descripcion && this.usuario.descripcion.trim()) {
      return this.usuario.descripcion.trim();
    }
    return 'Todavía no has agregado una descripción a tu perfil.';
  }

  get verificado(): boolean {
    return this.usuario.verificacion === 'verificado';
  }

  // fecha de registro, en el html se le da formato con el pipe date
  get fechaRegistro(): string | null {
    if (this.usuario.fechaRegistro) {
      return this.usuario.fechaRegistro;
    }
    return null;
  }

  get totalPublicaciones(): number {
    if (this.usuario.publicaciones) {
      return this.usuario.publicaciones;
    }
    return 0;
  }

  get totalIntercambios(): number {
    if (this.usuario.intercambios) {
      return this.usuario.intercambios;
    }
    return 0;
  }

  // avisos sin leer, para el punto rojo de la campana
  get notificaciones(): number {
    return this.servicio.notificacionesSinLeer();
  }

  // true cuando ya tiene las calificaciones suficientes para mostrarlas
  get muestraCalificacion(): boolean {
    return this.totalCalificaciones >= this.totalCalificacionesRequeridas;
  }

  // estrellas llenas y vacias segun el promedio
  estrellas(): boolean[] {
    const lista: boolean[] = [];
    for (let i = 0; i < this.calificacionMaxima; i++) {
      lista.push(i < Math.round(this.calificacion));
    }
    return lista;
  }

  // menu pequeño del avatar

  menuAbierto = signal(false);

  abrirMenu(): void {
    this.menuAbierto.set(!this.menuAbierto());
  }

  @HostListener('document:click')
  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  cerrarSesion(): void {
    this.servicio.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
