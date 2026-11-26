import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatCard } from '../../../components/admin/stat-card/stat-card';
import { BadgeEstado } from '../../../components/admin/badge-estado/badge-estado';
import { Icon } from '../../../components/admin/icon/icon';
import { MetricasAdminService } from '../../../services/admin/metricas-admin.service';
import { HistorialAdminService } from '../../../services/admin/historial-admin.service';
import { AlertasAdminService } from '../../../services/admin/alertas-admin.service';
import { PublicacionesAdminService } from '../../../services/admin/publicaciones-admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, StatCard, BadgeEstado, Icon],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private metricasSrv = inject(MetricasAdminService);
  private historialSrv = inject(HistorialAdminService);
  private alertasSrv = inject(AlertasAdminService);
  private publicacionesSrv = inject(PublicacionesAdminService);

  cargando = this.metricasSrv.cargando;
  resumen = this.metricasSrv.resumen;
  comparativas = this.metricasSrv.comparativas;

  actividad = computed(() => this.metricasSrv.actividadUsuarios('anio'));
  intercambios = computed(() => this.metricasSrv.intercambiosPorMes('anio'));
  categorias = computed(() => this.metricasSrv.publicacionesPorCategoria());
  ubicaciones = computed(() => this.metricasSrv.actividadPorUbicacion());

  accionesRecientes = computed(() => this.historialSrv.recientes(5));
  alertasActivas = computed(() => this.alertasSrv.alertas().filter(a => !a.leida).slice(0, 3));
  reportesRecientes = computed(() =>
    this.publicacionesSrv.reportadas().filter(p => p.estado === 'pendiente').slice(0, 5)
  );

  // porcentaje de variacion de cada tarjeta (null si no hay comparativa)
  variacion(clave: string): number | null {
    const comparativa = this.comparativas()[clave];
    if (comparativa) {
      return comparativa.porcentaje;
    }
    return null;
  }

  ngOnInit(): void {
    // los servicios ya fueron cargados por el layout; esto cubre el acceso directo
    this.metricasSrv.cargar();
    this.historialSrv.cargar();
    this.alertasSrv.cargar();
    this.publicacionesSrv.cargar();
    this.metricasSrv.iniciarTiempoReal(6000);
  }

  ngOnDestroy(): void {
    this.metricasSrv.detenerTiempoReal();
  }
}
