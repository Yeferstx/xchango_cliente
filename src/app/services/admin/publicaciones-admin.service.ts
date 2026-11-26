import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { API_URL } from '../../config/api';
import { Usuario } from '../../models/usuario.model';
import { Categoria } from '../../models/categoria.model';
import { Publicacion, ETIQUETA_TIPO } from '../../models/publicacion.model';
import { PublicacionReportada, Reporte } from '../../models/admin/publicacion-reportada';
import { PublicacionEliminada, PublicacionEliminadaVista } from '../../models/admin/publicacion-eliminada';
import { AdminUsuario } from '../../models/admin/admin-usuario';

// moderacion de publicaciones reportadas
// une el reporte con la publicacion, el usuario y la categoria
@Injectable({ providedIn: 'root' })
export class PublicacionesAdminService {
  private http = inject(HttpClient);

  private listaReportes = signal<Reporte[]>([]);
  private listaEliminadas = signal<PublicacionEliminada[]>([]);
  private listaPublicaciones = signal<Publicacion[]>([]);
  private listaUsuarios = signal<Usuario[]>([]);
  private listaCategorias = signal<Categoria[]>([]);
  private listaAdmins = signal<AdminUsuario[]>([]);
  private estaCargando = signal(false);
  private mensajeError = signal('');
  private cargado = false;

  cargando = this.estaCargando.asReadonly();
  error = this.mensajeError.asReadonly();

  // reportes con titulo, dueño y categoria
  reportadas = computed(() => {
    const lista: PublicacionReportada[] = [];

    for (const r of this.listaReportes()) {
      const vista: any = Object.assign({}, r);
      const pub = this.obtenerPublicacion(r.publicacionId);

      vista.titulo = 'Publicación no disponible';
      vista.usuarioId = '';
      vista.usuarioNombre = 'Usuario desconocido';
      vista.categoria = 'Sin categoría';
      vista.tipo = '';

      if (pub) {
        vista.titulo = pub.titulo;
        vista.usuarioId = pub.usuarioId;
        vista.tipo = ETIQUETA_TIPO[pub.tipo];
        vista.usuarioNombre = this.nombreUsuario(pub.usuarioId);

        for (const c of this.listaCategorias()) {
          if (c.id === pub.categoriaId) {
            vista.categoria = c.nombre;
          }
        }
      }

      vista.reportanteNombre = this.nombreUsuario(r.reportanteId);
      lista.push(vista);
    }

    return lista;
  });

  // eliminadas con titulo y nombres
  eliminadas = computed(() => {
    const lista: PublicacionEliminadaVista[] = [];

    for (const e of this.listaEliminadas()) {
      const vista: any = Object.assign({}, e);

      vista.titulo = 'Publicación no disponible';
      const pub = this.obtenerPublicacion(e.publicacionId);
      if (pub) {
        vista.titulo = pub.titulo;
      }

      vista.usuarioNombre = this.nombreUsuario(e.usuarioId);

      vista.administrador = 'Administrador';
      for (const a of this.listaAdmins()) {
        if (a.id === e.adminId) {
          vista.administrador = a.nombre;
        }
      }

      lista.push(vista);
    }

    return lista;
  });

  pendientes = computed(() => {
    let total = 0;
    for (const r of this.listaReportes()) {
      if (r.estado === 'pendiente') {
        total = total + 1;
      }
    }
    return total;
  });

  cargar(): void {
    if (this.cargado) {
      return;
    }
    this.cargado = true;
    this.estaCargando.set(true);
    this.mensajeError.set('');

    forkJoin({
      reportes: this.http.get(API_URL + '/admin/reportes'),
      eliminadas: this.http.get(API_URL + '/admin/eliminadas'),
      publicaciones: this.http.get(API_URL + '/admin/publicaciones'),
      usuarios: this.http.get(API_URL + '/admin/usuarios'),
      categorias: this.http.get(API_URL + '/categorias'),
      admins: this.http.get(API_URL + '/admin/admins'),
    }).subscribe({
      next: (datos: any) => {
        this.listaReportes.set(datos.reportes);
        this.listaEliminadas.set(datos.eliminadas);
        this.listaPublicaciones.set(datos.publicaciones);
        this.listaUsuarios.set(datos.usuarios);
        this.listaCategorias.set(datos.categorias);
        this.listaAdmins.set(datos.admins);
        this.estaCargando.set(false);
      },
      error: () => {
        this.cargado = false;
        this.mensajeError.set('No se pudieron cargar las publicaciones reportadas.');
        this.estaCargando.set(false);
      },
    });
  }

  private nombreUsuario(id: string): string {
    for (const u of this.listaUsuarios()) {
      if (u.id === id) {
        return u.nombre;
      }
    }
    return 'Usuario desconocido';
  }

  // consultas

  motivos(): string[] {
    const lista: string[] = [];
    for (const r of this.listaReportes()) {
      if (!lista.includes(r.motivo)) {
        lista.push(r.motivo);
      }
    }
    return lista.sort();
  }

  // sale de las categorias de la base, no de los reportes
  categorias(): string[] {
    const lista: string[] = [];
    for (const c of this.listaCategorias()) {
      lista.push(c.nombre);
    }
    return lista.sort();
  }

  // filtros de la tabla, 'todos' o 'todas' es sin filtro
  filtrar(f: { motivo?: string; estado?: string; gravedad?: string; categoria?: string }): PublicacionReportada[] {
    const lista: PublicacionReportada[] = [];

    for (const p of this.reportadas()) {
      let pasa = true;

      if (f.motivo && f.motivo !== 'todos' && p.motivo !== f.motivo) {
        pasa = false;
      }
      if (f.estado && f.estado !== 'todos' && p.estado !== f.estado) {
        pasa = false;
      }
      if (f.gravedad && f.gravedad !== 'todas' && p.gravedad !== f.gravedad) {
        pasa = false;
      }
      if (f.categoria && f.categoria !== 'todas' && p.categoria !== f.categoria) {
        pasa = false;
      }

      if (pasa) {
        lista.push(p);
      }
    }

    return lista;
  }

  obtenerPublicacion(publicacionId: string): Publicacion | undefined {
    for (const p of this.listaPublicaciones()) {
      if (p.id === publicacionId) {
        return p;
      }
    }
    return undefined;
  }

  // cambios

  private recargar(): void {
    this.cargado = false;
    this.cargar();
  }

  aprobar(reporteId: string): void {
    this.actualizarEstado(reporteId, 'aprobada');
    this.http.patch(API_URL + '/admin/reportes/' + reporteId, { estado: 'aprobada' }).subscribe({
      error: () => this.recargar(),
    });
  }

  // marca el reporte como resuelto, la publicacion queda eliminada
  // y se agrega a la lista de eliminadas
  eliminar(reporteId: string, motivo: string, adminId: string): void {
    let reporte: Reporte | undefined = undefined;
    for (const r of this.listaReportes()) {
      if (r.id === reporteId) {
        reporte = r;
      }
    }
    if (!reporte) {
      return;
    }

    const publicacion = this.obtenerPublicacion(reporte.publicacionId);
    if (!publicacion) {
      return;
    }

    this.actualizarEstado(reporteId, 'eliminada');

    const nuevasPublicaciones: Publicacion[] = [];
    for (const p of this.listaPublicaciones()) {
      if (p.id === publicacion.id) {
        const copia: any = Object.assign({}, p);
        copia.estado = 'eliminada';
        nuevasPublicaciones.push(copia);
      } else {
        nuevasPublicaciones.push(p);
      }
    }
    this.listaPublicaciones.set(nuevasPublicaciones);

    const registro: PublicacionEliminada = {
      id: 'el_' + Date.now(),
      publicacionId: publicacion.id,
      usuarioId: publicacion.usuarioId,
      adminId: adminId,
      motivo: motivo,
      fecha: new Date().toISOString(),
    };
    const nuevasEliminadas = [registro].concat(this.listaEliminadas());
    this.listaEliminadas.set(nuevasEliminadas);

    this.http.post(API_URL + '/admin/reportes/' + reporteId + '/eliminar', { motivo: motivo }).subscribe({
      error: () => this.recargar(),
    });
  }

  private actualizarEstado(reporteId: string, estado: Reporte['estado']): void {
    const nuevaLista: Reporte[] = [];
    for (const r of this.listaReportes()) {
      const copia = Object.assign({}, r);
      if (r.id === reporteId) {
        copia.estado = estado;
      }
      nuevaLista.push(copia);
    }
    this.listaReportes.set(nuevaLista);
  }
}
