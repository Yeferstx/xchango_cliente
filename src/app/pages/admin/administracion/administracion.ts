import { Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BadgeEstado } from '../../../components/admin/badge-estado/badge-estado';
import { Icon } from '../../../components/admin/icon/icon';
import { MetricasAdminService } from '../../../services/admin/metricas-admin.service';
import { UsuariosAdminService } from '../../../services/admin/usuarios-admin.service';
import { PublicacionesAdminService } from '../../../services/admin/publicaciones-admin.service';
import { AlertasAdminService } from '../../../services/admin/alertas-admin.service';
import { HistorialAdminService } from '../../../services/admin/historial-admin.service';

@Component({
  selector: 'app-administracion',
  standalone: true,
  imports: [DatePipe, BadgeEstado, Icon],
  templateUrl: './administracion.html',
  styleUrl: './administracion.css',
})
export class Administracion implements OnInit {
  private metricasSrv = inject(MetricasAdminService);
  private usuariosSrv = inject(UsuariosAdminService);
  private publicacionesSrv = inject(PublicacionesAdminService);
  private alertasSrv = inject(AlertasAdminService);
  private historialSrv = inject(HistorialAdminService);

  resumen = this.metricasSrv.resumen;
  alertas = this.alertasSrv.alertas;

  // usuarios "conectados": los activos con mayor nivel de actividad
  conectados = computed(() =>
    this.usuariosSrv.usuarios()
      .filter(u => u.estado === 'activo' && u.nivelActividad !== 'bajo')
      .slice(0, 6)
  );

  publicacionesRecientes = computed(() => this.publicacionesSrv.reportadas().slice(0, 5));
  acciones = computed(() => this.historialSrv.recientes(6));

  // semaforo del estado general de la plataforma
  estadoPlataforma = computed(() => {
    const pendientes = this.publicacionesSrv.pendientes();
    const alertasAltas = this.alertasSrv.porPrioridad('alta').filter(a => !a.leida).length;

    if (alertasAltas >= 2 || pendientes >= 10) {
      return { nivel: 'danger', texto: 'Requiere atención', detalle: 'Hay incidencias que necesitan revisión inmediata.' };
    }
    if (alertasAltas > 0 || pendientes > 0) {
      return { nivel: 'warn', texto: 'Con pendientes', detalle: 'La plataforma opera con normalidad, pero hay tareas abiertas.' };
    }
    return { nivel: 'ok', texto: 'Operativo', detalle: 'Todos los servicios funcionan correctamente.' };
  });

  servicios = [
    { nombre: 'API de publicaciones', estado: 'activo', detalle: 'Latencia 82 ms' },
    { nombre: 'Base de datos', estado: 'activo', detalle: 'Conexiones 24/100' },
    { nombre: 'Servicio de imágenes', estado: 'activo', detalle: 'Almacenamiento 41%' },
    { nombre: 'Notificaciones', estado: 'activo', detalle: 'Cola vacía' },
  ];

  ngOnInit(): void {
    this.metricasSrv.cargar();
    this.usuariosSrv.cargar();
    this.publicacionesSrv.cargar();
    this.alertasSrv.cargar();
    this.historialSrv.cargar();
  }

  marcarLeida(id: string): void {
    this.alertasSrv.marcarLeida(id);
  }
}
