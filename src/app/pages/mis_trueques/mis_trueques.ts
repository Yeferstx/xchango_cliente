import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { TruequesService } from '../../services/trueques';
import { TruequeVista, ETIQUETA_ESTADO_TRUEQUE } from '../../models/trueque.model';

type Pestana = 'recibidos' | 'enviados';

// HU45-HU53: bandeja de solicitudes de trueque
// aceptar, rechazar, confirmar, calificar y contactar por WhatsApp
@Component({
  selector: 'app-mis-trueques',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis_trueques.html',
  styleUrl: './mis_trueques.css',
})
export class MisTruequesComponent implements OnInit {
  private srv = inject(TruequesService);

  private route = inject(ActivatedRoute);
  private parametros = this.route.snapshot.queryParamMap;
  desdeNotificaciones = this.parametros.get('desde') === 'notificaciones';
  destacado = signal<string | null>(null);

  pestana = signal('recibidos');
  etiquetas = ETIQUETA_ESTADO_TRUEQUE;
  notas = [1, 2, 3, 4, 5];
  aviso = signal('');

  recibidos = this.srv.truequesRecibidos;
  enviados = this.srv.truequesEnviados;

  listado = computed(() => {
    if (this.pestana() === 'recibidos') {
      return this.recibidos();
    }
    return this.enviados();
  });

  pendientes = this.srv.solicitudesPendientes;

  async ngOnInit(): Promise<void> {
    await this.srv.esperarDatos();
    const id = this.parametros.get('trueque');
    if (!id) {
      return;
    }
    // se busca si el trueque de la notificacion es enviado o recibido
    let pestana = '';
    for (const t of this.enviados()) {
      if (t.id === id) {
        pestana = 'enviados';
      }
    }
    for (const t of this.recibidos()) {
      if (t.id === id) {
        pestana = 'recibidos';
      }
    }

    if (!pestana) {
      this.aviso.set('El trueque de esta notificación ya no está disponible.');
      return;
    }

    this.pestana.set(pestana);
    this.destacado.set(id);
  }


  cambiarPestana(p: Pestana): void {
    this.pestana.set(p);
  }

  aceptar(t: TruequeVista): void {
    this.srv.aceptarTrueque(t.id);
  }

  rechazar(t: TruequeVista): void {
    this.srv.rechazarTrueque(t.id);
  }

  confirmar(t: TruequeVista): void {
    this.srv.confirmarTrueque(t.id);
  }

  calificar(t: TruequeVista, nota: number): void {
    this.srv.calificarTrueque(t.id, nota);
  }

  miCalificacion(t: TruequeVista): number {
    return this.srv.miCalificacion(t);
  }

  // true si ya confirme mi parte y falta la contraparte
  esperandoContraparte(t: TruequeVista): boolean {
    const yo = this.srv.usuarioActualId();
    if (t.estado !== 'aceptado') {
      return false;
    }
    if (t.solicitanteId === yo) {
      return t.confirmadoSolicitante;
    }
    return t.confirmadoPropietario;
  }

  contactar(t: TruequeVista): void {
    this.srv.abrirWhatsApp(this.srv.enlaceWhatsAppTrueque(t));
  }

  claseEstado(estado: string): string {
    // cancelado usa el mismo color de rechazado
    if (estado === 'cancelado') {
      return 'chip chip--rechazado';
    }
    return 'chip chip--' + estado;
  }
}
