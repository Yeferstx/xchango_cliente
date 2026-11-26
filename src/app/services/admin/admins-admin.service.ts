import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_URL, borrarToken, guardarToken, leerToken, mensajeDeError } from '../../config/api';
import { AdminUsuario } from '../../models/admin/admin-usuario';

const CLAVE_SESION = 'xchango_admin';

@Injectable({ providedIn: 'root' })
export class AdminsAdminService {
  private http = inject(HttpClient);

  // sesion activa, se lee del localStorage para que no se pierda con F5
  private adminSesion = signal<AdminUsuario | null>(this.leerSesion());
  private estaCargando = signal(false);

  admin = this.adminSesion.asReadonly();
  cargando = this.estaCargando.asReadonly();
  autenticado = computed(() => this.adminSesion() !== null);

  // solo el administrador puede crear usuarios internos y borrar cuentas
  esAdministrador = computed(() => {
    const admin = this.adminSesion();
    if (admin && admin.rol === 'admin') {
      return true;
    }
    return false;
  });

  // lista de usuarios internos (administradores y moderadores)
  private listaAdmins = signal<AdminUsuario[]>([]);
  lista = this.listaAdmins.asReadonly();
  private yaCargo = false;

  // trae los usuarios internos desde el MID
  cargar(): void {
    if (this.yaCargo || !this.autenticado()) {
      return;
    }
    this.yaCargo = true;

    this.http.get(API_URL + '/admin/admins').subscribe({
      next: (datos: any) => this.listaAdmins.set(datos),
      error: () => {
        this.yaCargo = false;
      },
    });
  }

  // crea un moderador o administrador
  // devuelve null si se creo bien, o el mensaje de error
  async crearUsuarioInterno(datos: {
    nombre: string;
    email: string;
    password: string;
    rol: 'admin' | 'moderador';
    estado: 'activo' | 'inactivo';
  }): Promise<string | null> {
    if (!this.esAdministrador()) {
      return 'Solo un administrador puede crear usuarios internos.';
    }

    try {
      const nuevo: any = await firstValueFrom(
        this.http.post(API_URL + '/admin/admins', {
          nombre: datos.nombre.trim(),
          email: datos.email.trim().toLowerCase(),
          password: datos.password,
          rol: datos.rol,
          estado: datos.estado,
        }),
      );
      this.listaAdmins.set(this.listaAdmins().concat([nuevo]));
      return null;
    } catch (e) {
      return mensajeDeError(e);
    }
  }

  // activa o desactiva un usuario interno, solo el administrador
  async cambiarEstado(id: string, estado: 'activo' | 'inactivo'): Promise<boolean> {
    if (!this.esAdministrador()) {
      return false;
    }

    try {
      await firstValueFrom(this.http.patch(API_URL + '/admin/admins/' + id + '/estado', { estado: estado }));

      const nuevaLista: AdminUsuario[] = [];
      for (const a of this.listaAdmins()) {
        const copia = Object.assign({}, a);
        if (a.id === id) {
          copia.estado = estado;
        }
        nuevaLista.push(copia);
      }
      this.listaAdmins.set(nuevaLista);
      return true;
    } catch {
      return false;
    }
  }

  // elimina un usuario interno, solo el administrador y no a si mismo
  async eliminarUsuarioInterno(id: string): Promise<string | null> {
    if (!this.esAdministrador()) {
      return 'Solo un administrador puede eliminar cuentas.';
    }
    if (id === this.idActual()) {
      return 'No puedes eliminar tu propia cuenta.';
    }

    try {
      await firstValueFrom(this.http.delete(API_URL + '/admin/admins/' + id));
      this.listaAdmins.set(this.listaAdmins().filter((a) => a.id !== id));
      return null;
    } catch (e) {
      return mensajeDeError(e);
    }
  }

  // login contra el MID: POST /auth/admin/login
  async login(email: string, password: string): Promise<AdminUsuario> {
    this.estaCargando.set(true);
    try {
      const respuesta: any = await firstValueFrom(
        this.http.post(API_URL + '/auth/admin/login', {
          email: email.trim().toLowerCase(),
          password: password,
        }),
      );

      guardarToken(respuesta.token, true);
      localStorage.setItem(CLAVE_SESION, JSON.stringify(respuesta.admin));
      this.adminSesion.set(respuesta.admin);
      this.yaCargo = false;
      return respuesta.admin;
    } catch (e) {
      throw new Error(mensajeDeError(e));
    } finally {
      this.estaCargando.set(false);
    }
  }

  logout(): void {
    localStorage.removeItem(CLAVE_SESION);
    borrarToken(true);
    this.adminSesion.set(null);
    this.listaAdmins.set([]);
    this.yaCargo = false;
  }

  // id del admin en sesion, es lo que se guarda en el historial
  idActual(): string {
    const admin = this.adminSesion();
    if (admin) {
      return admin.id;
    }
    return '';
  }

  // nombre del admin en sesion, solo para mostrarlo
  nombreActual(): string {
    const admin = this.adminSesion();
    if (admin) {
      return admin.nombre;
    }
    return 'Administrador';
  }

  private leerSesion(): AdminUsuario | null {
    try {
      const guardado = localStorage.getItem(CLAVE_SESION);
      if (!guardado || !leerToken(true)) {
        return null;
      }
      return JSON.parse(guardado);
    } catch {
      return null;
    }
  }
}
