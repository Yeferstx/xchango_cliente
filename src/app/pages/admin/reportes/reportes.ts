import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { DatePipe } from '@angular/common';

import { StatCard } from '../../../components/admin/stat-card/stat-card';
import { ChartLinea } from '../../../components/admin/chart-linea/chart-linea';
import { ChartBarras } from '../../../components/admin/chart-barras/chart-barras';
import { ChartDona } from '../../../components/admin/chart-dona/chart-dona';
import { BadgeEstado } from '../../../components/admin/badge-estado/badge-estado';
import { FiltroFechas } from '../../../components/admin/filtro-fechas/filtro-fechas';
import { Icon } from '../../../components/admin/icon/icon';

import {
  MetricasAdminService,
  Periodo
} from '../../../services/admin/metricas-admin.service';

import { UsuariosAdminService } from '../../../services/admin/usuarios-admin.service';
import { HistorialAdminService } from '../../../services/admin/historial-admin.service';
import { AlertasAdminService } from '../../../services/admin/alertas-admin.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    DatePipe,
    StatCard,
    ChartLinea,
    ChartBarras,
    ChartDona,
    BadgeEstado,
    FiltroFechas,
    Icon
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit, OnDestroy {

  private metricasSrv = inject(MetricasAdminService);
  private usuariosSrv = inject(UsuariosAdminService);
  private historialSrv = inject(HistorialAdminService);
  private alertasSrv = inject(AlertasAdminService);

  resumen = this.metricasSrv.resumen;
  comparativas = this.metricasSrv.comparativas;
  alertas = this.alertasSrv.alertas;

  periodo = signal<Periodo>('90d');

  desde = signal('');
  hasta = signal('');
  exportando = signal('');

  actividad = computed(() =>
    this.metricasSrv.actividadUsuarios(this.periodo())
  );

  intercambios = computed(() =>
    this.metricasSrv.intercambiosPorMes(this.periodo())
  );

  categorias = computed(() =>
    this.metricasSrv.publicacionesPorCategoria()
  );

  ubicaciones = computed(() =>
    this.metricasSrv.actividadPorUbicacion()
  );

  // HU76, ranking de usuarios mas activos
  ranking = computed(() =>
    this.usuariosSrv.ranking('actividad', 5)
  );

  // HU68, historial filtrado por rango de fechas
  historial = computed(() =>
    this.historialSrv.entreFechas(
      this.desde() || undefined,
      this.hasta() || undefined
    )
  );

  ngOnInit(): void {
    this.metricasSrv.cargar();
    this.usuariosSrv.cargar();
    this.historialSrv.cargar();
    this.alertasSrv.cargar();

    this.metricasSrv.iniciarTiempoReal(6000);
  }

  ngOnDestroy(): void {
    this.metricasSrv.detenerTiempoReal();
  }

  cambiarRango(r: any): void {
    this.desde.set(r.desde);
    this.hasta.set(r.hasta);

    if (r.periodo === 'personalizado') {
      return;
    }

    switch (r.periodo) {
      case 'hoy':
        this.periodo.set('1d');
        break;

      case '7dias':
        this.periodo.set('7d');
        break;

      case '30dias':
        this.periodo.set('30d');
        break;

      case '90dias':
        this.periodo.set('90d');
        break;

      default:
        break;
    }
  }

  variacion(clave: string): number | null {
    const comparativa = this.comparativas()[clave];
    if (comparativa) {
      return comparativa.porcentaje;
    }
    return null;
  }

  // HU67, exportar en CSV, Excel lo abre directo
  exportarCSV(): void {
    const resumen: any = this.resumen();
    let csv = 'Métrica;Valor\n';

    for (const clave of Object.keys(resumen)) {
      csv = csv + clave + ';' + resumen[clave] + '\n';
    }

    csv = csv + '\nCategoría;Publicaciones\n';
    for (const c of this.categorias()) {
      csv = csv + c.label + ';' + c.valor + '\n';
    }

    csv = csv + '\nUbicación;Actividad\n';
    for (const u of this.ubicaciones()) {
      csv = csv + u.label + ';' + u.valor + '\n';
    }

    this.descargar(
      new Blob(
        ['\uFEFF' + csv],
        { type: 'text/csv;charset=utf-8;' }
      ),
      'reporte-xchango.csv'
    );

    this.avisar('CSV');
  }

  // abre el dialogo de impresion para guardar como PDF
  exportarPDF(): void {
    this.avisar('PDF');

    setTimeout(() => {
      window.print();
    }, 200);
  }

  private descargar(blob: Blob, nombre: string): void {

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = nombre;

    enlace.click();

    URL.revokeObjectURL(url);
  }

  private avisar(formato: string): void {

    this.exportando.set(formato);

    setTimeout(() => {
      this.exportando.set('');
    }, 2200);
  }
}