import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { API_URL } from '../../config/api';
import { Documento, DocumentoVista } from '../../models/admin/documento';
import { Usuario } from '../../models/usuario.model';
import { AdminUsuario } from '../../models/admin/admin-usuario';

// verificacion de documentos, el admin o moderador aprueba o rechaza
@Injectable({ providedIn: 'root' })
export class DocumentosAdminService {
  private http = inject(HttpClient);

  private listaDocumentos = signal<Documento[]>([]);
  private listaUsuarios = signal<Usuario[]>([]);
  private listaAdmins = signal<AdminUsuario[]>([]);
  private estaCargando = signal(false);
  private mensajeError = signal('');
  private yaCargo = false;

  cargando = this.estaCargando.asReadonly();
  error = this.mensajeError.asReadonly();

  // documentos con el nombre del usuario y del que lo reviso
  documentos = computed(() => {
    const lista: DocumentoVista[] = [];

    for (const d of this.listaDocumentos()) {
      const vista: any = Object.assign({}, d);

      vista.usuarioNombre = 'Usuario desconocido';
      vista.usuarioEmail = '';
      vista.usuarioAvatar = '/Logo-xchango/avatar-defecto.png';
      for (const u of this.listaUsuarios()) {
        if (u.id === d.usuarioId) {
          vista.usuarioNombre = u.nombre;
          vista.usuarioEmail = u.email;
          if (u.avatar) {
            vista.usuarioAvatar = u.avatar;
          }
        }
      }

      vista.revisorNombre = '';
      for (const a of this.listaAdmins()) {
        if (d.revisadoPor && a.id === d.revisadoPor) {
          vista.revisorNombre = a.nombre;
        }
      }

      lista.push(vista);
    }

    return lista;
  });

  pendientes = computed(() => this.documentos().filter((d) => d.estado === 'pendiente'));
  aprobados = computed(() => this.documentos().filter((d) => d.estado === 'aprobado'));
  rechazados = computed(() => this.documentos().filter((d) => d.estado === 'rechazado'));

  cargar(): void {
    if (this.yaCargo) {
      return;
    }
    this.yaCargo = true;
    this.estaCargando.set(true);

    forkJoin({
      documentos: this.http.get(API_URL + '/admin/documentos'),
      usuarios: this.http.get(API_URL + '/admin/usuarios'),
      admins: this.http.get(API_URL + '/admin/admins'),
    }).subscribe({
      next: (datos: any) => {
        this.listaDocumentos.set(datos.documentos);
        this.listaUsuarios.set(datos.usuarios);
        this.listaAdmins.set(datos.admins);
        this.estaCargando.set(false);
      },
      error: () => {
        this.yaCargo = false;
        this.mensajeError.set('No se pudieron cargar los documentos.');
        this.estaCargando.set(false);
      },
    });
  }

  // aprueba el documento, la cuenta del usuario queda verificada
  aprobar(id: string, adminId: string, observacion: string): void {
    if (!observacion) {
      observacion = 'Documento verificado sin novedad.';
    }
    this.actualizar(id, 'aprobado', adminId, observacion);
  }

  // rechaza el documento, la observacion explica el motivo
  rechazar(id: string, adminId: string, observacion: string): void {
    if (!observacion) {
      observacion = 'El documento no cumple los requisitos.';
    }
    this.actualizar(id, 'rechazado', adminId, observacion);
  }

  private actualizar(id: string, estado: Documento['estado'], adminId: string, observacion: string): void {
    const nuevaLista: Documento[] = [];
    for (const d of this.listaDocumentos()) {
      const copia = Object.assign({}, d);
      if (d.id === id) {
        copia.estado = estado;
        copia.revisadoPor = adminId;
        copia.observacion = observacion;
      }
      nuevaLista.push(copia);
    }
    this.listaDocumentos.set(nuevaLista);

    this.http.patch(API_URL + '/admin/documentos/' + id, { estado: estado, observacion: observacion }).subscribe({
      error: () => {
        this.yaCargo = false;
        this.cargar();
      },
    });
  }
}
