import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { API_URL } from '../../config/api';
import { AccionAdmin, AccionAdminVista } from '../../models/admin/accion-admin';
import { AdminUsuario } from '../../models/admin/admin-usuario';
import { Usuario } from '../../models/usuario.model';

// historial de moderacion, los nombres se buscan por id
@Injectable({ providedIn: 'root' })
export class HistorialAdminService {
  private http = inject(HttpClient);

  private listaAcciones = signal<AccionAdmin[]>([]);
  private listaUsuarios = signal<Usuario[]>([]);
  private listaAdmins = signal<AdminUsuario[]>([]);
  private estaCargando = signal(false);
  private mensajeError = signal('');
  private cargado = false;

  cargando = this.estaCargando.asReadonly();
  error = this.mensajeError.asReadonly();

  acciones = computed(() => {
    const lista: AccionAdminVista[] = [];

    for (const a of this.listaAcciones()) {
      const vista: any = Object.assign({}, a);

      vista.usuarioNombre = 'Usuario desconocido';
      for (const u of this.listaUsuarios()) {
        if (u.id === a.usuarioId) {
          vista.usuarioNombre = u.nombre;
        }
      }

      vista.administrador = 'Administrador';
      for (const ad of this.listaAdmins()) {
        if (ad.id === a.adminId) {
          vista.administrador = ad.nombre;
        }
      }

      lista.push(vista);
    }

    return lista;
  });

  cargar(): void {
    if (this.cargado) {
      return;
    }
    this.cargado = true;
    this.estaCargando.set(true);
    this.mensajeError.set('');

    forkJoin({
      acciones: this.http.get(API_URL + '/admin/historial'),
      usuarios: this.http.get(API_URL + '/admin/usuarios'),
      admins: this.http.get(API_URL + '/admin/admins'),
    }).subscribe({
      next: (datos: any) => {
        this.listaAcciones.set(datos.acciones);
        this.listaUsuarios.set(datos.usuarios);
        this.listaAdmins.set(datos.admins);
        this.estaCargando.set(false);
      },
      error: () => {
        this.cargado = false;
        this.mensajeError.set('No se pudo cargar el historial.');
        this.estaCargando.set(false);
      },
    });
  }

  // HU71, historial de un usuario
  porUsuario(usuarioId: string): AccionAdminVista[] {
    return this.acciones().filter((a) => a.usuarioId === usuarioId);
  }

  // HU68, filtro por rango de fechas
  entreFechas(desde?: string, hasta?: string): AccionAdminVista[] {
    const lista: AccionAdminVista[] = [];

    for (const a of this.acciones()) {
      const fecha = new Date(a.fecha).getTime();
      let pasa = true;

      if (desde && fecha < new Date(desde).getTime()) {
        pasa = false;
      }
      // se suma un dia para que "hasta" incluya el dia completo
      if (hasta && fecha > new Date(hasta).getTime() + 86400000) {
        pasa = false;
      }

      if (pasa) {
        lista.push(a);
      }
    }

    return lista;
  }

  recientes(limite = 5): AccionAdminVista[] {
    const lista = this.acciones().slice();
    lista.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return lista.slice(0, limite);
  }

  // registra una accion nueva, recibe ids y no nombres
  registrar(accion: any): void {
    const idTemporal = 'ac_' + Date.now();

    const nueva: any = Object.assign({}, accion);
    nueva.id = idTemporal;
    nueva.fecha = new Date().toISOString();
    this.listaAcciones.set([nueva].concat(this.listaAcciones()));

    this.http.post(API_URL + '/admin/historial', accion).subscribe({
      next: (guardada: any) => {
        // se cambia la temporal por la que guardo el MID
        const nuevaLista: AccionAdmin[] = [];
        for (const a of this.listaAcciones()) {
          if (a.id === idTemporal) {
            nuevaLista.push(guardada);
          } else {
            nuevaLista.push(a);
          }
        }
        this.listaAcciones.set(nuevaLista);
      },
      error: () => {
        this.cargado = false;
        this.cargar();
      },
    });
  }
}
