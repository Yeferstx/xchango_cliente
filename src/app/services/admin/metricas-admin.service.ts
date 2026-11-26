import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { API_URL } from '../../config/api';
import { Comparativa, MetricasData, MetricasResumen, SerieGrafico } from '../../models/admin/metrica';

export type Periodo = '1d' | '7d' | '30d' | '90d' | 'anio';

// se exportan otra vez para los archivos que las importaban desde aqui
export type { MetricasData, MetricasResumen, SerieGrafico };
export type MetricaComparativa = Comparativa;

@Injectable({ providedIn: 'root' })
export class MetricasAdminService {
  private http = inject(HttpClient);
  private datos = signal<MetricasData | null>(null);
  private estaCargando = signal(false);
  private mensajeError = signal('');
  private cargado = false;
  private temporizador: any = null;

  cargando = this.estaCargando.asReadonly();
  error = this.mensajeError.asReadonly();

  resumen = signal<MetricasResumen>({
    usuarios: 0,
    usuariosActivos: 0,
    publicaciones: 0,
    intercambios: 0,
    publicacionesReportadas: 0,
    usuariosSuspendidos: 0,
  });

  comparativas = signal<any>({});

  cargar(): void {
    if (this.cargado) {
      return;
    }
    this.cargado = true;
    this.estaCargando.set(true);

    this.http.get(API_URL + '/admin/metricas').subscribe({
      next: (datos: any) => {
        this.aplicar(datos);
        this.estaCargando.set(false);
      },
      error: () => {
        this.cargado = false;
        this.mensajeError.set('No se pudieron cargar las métricas.');
        this.estaCargando.set(false);
      },
    });
  }

  actividadUsuarios(periodo: Periodo): SerieGrafico[] {
    const d = this.datos();
    if (!d) {
      return [];
    }
    return this.recortar(d.actividadMensual, periodo);
  }

  intercambiosPorMes(periodo: Periodo): SerieGrafico[] {
    const d = this.datos();
    if (!d) {
      return [];
    }
    return this.recortar(d.intercambiosPorMes, periodo);
  }

  publicacionesPorCategoria(): SerieGrafico[] {
    const d = this.datos();
    if (!d) {
      return [];
    }
    return d.publicacionesPorCategoria;
  }

  actividadPorUbicacion(): SerieGrafico[] {
    const d = this.datos();
    if (!d) {
      return [];
    }
    return d.actividadPorUbicacion;
  }

  crecimientoCategorias(): SerieGrafico[] {
    const d = this.datos();
    if (!d) {
      return [];
    }
    return d.crecimientoCategorias;
  }

  categoriasMasUsadas(limite = 6): SerieGrafico[] {
    const lista = this.publicacionesPorCategoria().slice();
    lista.sort((a, b) => b.valor - a.valor);
    return lista.slice(0, limite);
  }

  ubicacionesMasActivas(limite = 7): SerieGrafico[] {
    const lista = this.actividadPorUbicacion().slice();
    lista.sort((a, b) => b.valor - a.valor);
    return lista.slice(0, limite);
  }

  // cada cierto tiempo vuelve a pedir las metricas
  iniciarTiempoReal(intervalo = 6000): void {
    if (this.temporizador === null) {
      this.temporizador = setInterval(() => this.recargar(), intervalo);
    }
  }

  detenerTiempoReal(): void {
    if (this.temporizador !== null) {
      clearInterval(this.temporizador);
    }
    this.temporizador = null;
  }

  private recargar(): void {
    this.http.get(API_URL + '/admin/metricas').subscribe((datos: any) => this.aplicar(datos));
  }

  private aplicar(datos: MetricasData): void {
    this.datos.set(datos);
    this.resumen.set(datos.resumen);
    this.comparativas.set(datos.comparativas);
  }

  // deja solo los ultimos datos segun el periodo
  private recortar(datos: SerieGrafico[], periodo: Periodo): SerieGrafico[] {
    let cantidad = datos.length;
    if (periodo === '1d') {
      cantidad = 1;
    } else if (periodo === '7d') {
      cantidad = 7;
    } else if (periodo === '30d') {
      cantidad = 30;
    } else if (periodo === '90d') {
      cantidad = 90;
    }

    if (cantidad > datos.length) {
      cantidad = datos.length;
    }
    return datos.slice(datos.length - cantidad);
  }
}
