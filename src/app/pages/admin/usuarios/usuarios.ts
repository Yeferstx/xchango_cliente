import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BadgeEstado } from '../../../components/admin/badge-estado/badge-estado';
import { Paginacion } from '../../../components/admin/paginacion/paginacion';
import { ModalConfirmacion } from '../../../components/admin/modal-confirmacion/modal-confirmacion';
import { Icon } from '../../../components/admin/icon/icon';
import { UsuariosAdminService } from '../../../services/admin/usuarios-admin.service';
import { HistorialAdminService } from '../../../services/admin/historial-admin.service';
import { AdminsAdminService } from '../../../services/admin/admins-admin.service';
import { UsuarioPlataforma } from '../../../models/admin/usuario-plataforma';

type TipoAccion = 'suspender' | 'activar' | 'advertir';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [DatePipe, FormsModule, BadgeEstado, Paginacion, ModalConfirmacion, Icon],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private usuariosSrv = inject(UsuariosAdminService);
  private historialSrv = inject(HistorialAdminService);
  private auth = inject(AdminsAdminService);

  cargando = this.usuariosSrv.cargando;
  error = this.usuariosSrv.error;

  // filtros
  busqueda = signal('');
  estado = signal('todos');
  nivel = signal('todos');
  ubicacion = signal('todas');
  pagina = signal(1);
  porPagina = 8;

  ubicaciones = computed(() => this.usuariosSrv.ubicaciones());

  filtrados = computed(() =>
    this.usuariosSrv.filtrar({
      busqueda: this.busqueda(),
      estado: this.estado(),
      nivel: this.nivel(),
      ubicacion: this.ubicacion(),
    })
  );

  visibles = computed(() =>
    this.usuariosSrv.paginar(this.filtrados(), this.pagina(), this.porPagina)
  );

  // panel de detalle e historial
  detalle = signal<UsuarioPlataforma | null>(null);
  historial = computed(() => {
    const u = this.detalle();
    if (u) {
      return this.historialSrv.porUsuario(u.id);
    }
    return [];
  });

  // modal de confirmacion
  modal = signal<{ tipo: TipoAccion; usuario: UsuarioPlataforma } | null>(null);

  configModal = computed(() => {
    const m = this.modal();
    if (!m) {
      return null;
    }
    const config = {
      suspender: {
        titulo: 'Suspender usuario',
        mensaje: 'La cuenta de ' + m.usuario.nombre + ' quedará bloqueada y no podrá publicar ni intercambiar.',
        texto: 'Suspender',
        icono: 'ban',
        tono: 'danger' as const,
        pideMotivo: true,
      },
      activar: {
        titulo: 'Reactivar usuario',
        mensaje: m.usuario.nombre + ' recuperará el acceso completo a la plataforma.',
        texto: 'Reactivar',
        icono: 'check-circle',
        tono: 'neutro' as const,
        pideMotivo: false,
      },
      advertir: {
        titulo: 'Enviar advertencia',
        mensaje: 'Se notificará a ' + m.usuario.nombre + ' sobre el mal uso de la plataforma.',
        texto: 'Enviar advertencia',
        icono: 'alert',
        tono: 'warn' as const,
        pideMotivo: true,
      },
    };

    return config[m.tipo];
  });

  ngOnInit(): void {
    this.usuariosSrv.cargar();
    this.historialSrv.cargar();
  }

  // filtros
  buscar(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
  }

  filtrarEstado(valor: string): void {
    this.estado.set(valor);
    this.pagina.set(1);
  }

  filtrarNivel(valor: string): void {
    this.nivel.set(valor);
    this.pagina.set(1);
  }

  filtrarUbicacion(valor: string): void {
    this.ubicacion.set(valor);
    this.pagina.set(1);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.estado.set('todos');
    this.nivel.set('todos');
    this.ubicacion.set('todas');
    this.pagina.set(1);
  }

  // acciones
  abrirModal(tipo: TipoAccion, usuario: UsuarioPlataforma): void {
    this.modal.set({ tipo, usuario });
  }

  confirmarAccion(motivo: string): void {
    const m = this.modal();
    if (!m) {
      return;
    }

    let nombre = '';
    let texto = motivo;

    if (m.tipo === 'suspender') {
      this.usuariosSrv.suspender(m.usuario.id);
      nombre = 'Suspensión';
      if (!texto) {
        texto = 'Cuenta suspendida por el administrador.';
      }
    } else if (m.tipo === 'activar') {
      this.usuariosSrv.activar(m.usuario.id);
      nombre = 'Activación';
      texto = 'Cuenta reactivada por el administrador.';
    } else {
      this.usuariosSrv.advertir(m.usuario.id);
      nombre = 'Advertencia';
      if (!texto) {
        texto = 'Advertencia enviada por mal uso.';
      }
    }

    // queda guardada en el historial (HU71)
    this.historialSrv.registrar({
      usuarioId: m.usuario.id,
      adminId: this.auth.idActual(),
      accion: nombre,
      descripcion: texto,
    });

    // si el detalle de ese usuario esta abierto se actualiza
    const detalle = this.detalle();
    if (detalle && detalle.id === m.usuario.id) {
      const actualizado = this.usuariosSrv.obtener(m.usuario.id);
      if (actualizado) {
        this.detalle.set(actualizado);
      } else {
        this.detalle.set(null);
      }
    }

    this.modal.set(null);
  }

  verDetalle(usuario: UsuarioPlataforma): void {
    this.detalle.set(usuario);
  }
}
