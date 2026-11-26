import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../config/api';
import { Alerta } from '../../models/admin/alerta';

@Injectable({ providedIn: 'root' })
export class AlertasAdminService {
  private http = inject(HttpClient);

  private listaAlertas = signal<Alerta[]>([]);
  private estaCargando = signal(false);
  private mensajeError = signal('');
  private cargado = false;

  alertas = this.listaAlertas.asReadonly();
  cargando = this.estaCargando.asReadonly();
  error = this.mensajeError.asReadonly();

  // contador para el numerito de notificaciones del header
  noLeidas = computed(() => {
    let total = 0;
    for (const a of this.listaAlertas()) {
      if (!a.leida) {
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

    this.http.get(API_URL + '/admin/alertas').subscribe({
      next: (datos: any) => {
        this.listaAlertas.set(datos);
        this.estaCargando.set(false);
      },
      error: () => {
        this.cargado = false;
        this.mensajeError.set('No se pudieron cargar las alertas.');
        this.estaCargando.set(false);
      },
    });
  }

  porTipo(tipo: string): Alerta[] {
    if (tipo === 'todas') {
      return this.listaAlertas();
    }
    return this.listaAlertas().filter((a) => a.tipo === tipo);
  }

  porPrioridad(prioridad: string): Alerta[] {
    return this.listaAlertas().filter((a) => a.prioridad === prioridad);
  }

  private recargar(): void {
    this.cargado = false;
    this.cargar();
  }

  marcarLeida(id: string): void {
    const nuevaLista: Alerta[] = [];
    for (const a of this.listaAlertas()) {
      const copia = Object.assign({}, a);
      if (a.id === id) {
        copia.leida = true;
      }
      nuevaLista.push(copia);
    }
    this.listaAlertas.set(nuevaLista);

    this.http.patch(API_URL + '/admin/alertas/' + id + '/leida', {}).subscribe({
      error: () => this.recargar(),
    });
  }

  marcarTodasLeidas(): void {
    const nuevaLista: Alerta[] = [];
    for (const a of this.listaAlertas()) {
      const copia = Object.assign({}, a);
      copia.leida = true;
      nuevaLista.push(copia);
    }
    this.listaAlertas.set(nuevaLista);

    this.http.patch(API_URL + '/admin/alertas/leidas', {}).subscribe({
      error: () => this.recargar(),
    });
  }
}
