import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicacionVista, TipoPublicacion } from '../../models/publicacion.model';
import { TruequesService } from '../../services/trueques';

@Component({
  selector: 'app-modal-detalle-trueque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-detalle-trueque.html',
  styleUrl: './modal-detalle-trueque.css',
})
export class ModalDetalleTruequeComponent implements OnInit {
  // id de la publicacion cuando el detalle se abre COMO MODAL sobre el home
  // si no llega, se toma de la ruta /trueque/:id (entrada directa por URL)
  @Input() publicacionId: string | null = null;

  // avisa al home que hay que cerrar el modal
  @Output() cerrado = new EventEmitter<void>();

  // true cuando se muestra encima del home, false cuando es su propia pagina
  get esModal(): boolean {
    return this.publicacionId !== null;
  }

  private id = '';
  imagenActivaIndex = 0;

  // se busca cada vez porque los datos llegan por http
  get trueque(): PublicacionVista | null {
    const publicacion = this.truequesService.obtenerPorId(this.id);
    if (publicacion) {
      return publicacion;
    }
    return null;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private truequesService: TruequesService,
  ) {}

  ngOnInit(): void {
    // si viene por [publicacionId] es un modal encima del home
    // si no, se toma el id de la ruta /trueque/:id
    if (this.publicacionId) {
      this.id = this.publicacionId;
    } else {
      const idRuta = this.route.snapshot.paramMap.get('id');
      if (idRuta) {
        this.id = idRuta;
      }
    }
    this.truequesService.cargar();
  }

  get destinoVolver(): string {
    const origen = this.route.snapshot.queryParamMap.get('desde');
    if (origen === 'mis-publicaciones' || origen === 'mis-trueques' || origen === 'notificaciones') {
      return '/' + origen;
    }
    return '/home';
  }

  get textoVolver(): string {
    if (this.destinoVolver === '/mis-publicaciones') {
      return 'Volver a Mis publicaciones';
    }
    if (this.destinoVolver === '/mis-trueques') {
      return 'Volver a Mis trueques';
    }
    if (this.destinoVolver === '/notificaciones') {
      return 'Volver a Notificaciones';
    }
    return 'Volver al inicio';
  }

  volver(): void {
    // si esta encima del home solo se cierra, si es su propia pagina navega
    if (this.esModal) {
      this.cerrado.emit();
      return;
    }

    if (this.destinoVolver !== '/mis-trueques') {
      this.router.navigate([this.destinoVolver]);
      return;
    }

    // a mis trueques se vuelve con el trueque que estaba abierto
    const parametros = this.route.snapshot.queryParamMap;
    let desde = null;
    if (parametros.get('bandeja') === 'notificaciones') {
      desde = 'notificaciones';
    }
    this.router.navigate([this.destinoVolver], {
      queryParams: { trueque: parametros.get('trueque'), desde: desde },
    });
  }

  // cierra al hacer clic en el fondo oscuro, no al tocar la tarjeta
  cerrarPorFondo(evento: MouseEvent): void {
    if (this.esModal && evento.target === evento.currentTarget) {
      this.volver();
    }
  }

  alternarFavorito(): void {
    if (this.trueque) {
      this.truequesService.alternarFavorito(this.trueque);
    }
  }

  // pasa a la foto anterior; al llegar al inicio vuelve a la ultima
  fotoAnterior(): void {
    const total = this.imagenes.length;
    this.imagenActivaIndex = (this.imagenActivaIndex - 1 + total) % total;
  }

  // pasa a la siguiente; al llegar al final vuelve a la primera
  fotoSiguiente(): void {
    this.imagenActivaIndex = (this.imagenActivaIndex + 1) % this.imagenes.length;
  }

  seleccionarImagen(indice: number): void {
    this.imagenActivaIndex = indice;
  }

  manejarErrorImagen(evento: Event): void {
    const img: any = evento.target;
    img.src = 'https://placehold.co/600x450/ece2c9/1f1b16?text=Sin+imagen';
  }

  // texto que el usuario ofrece a cambio (HU42)
  ofrezco = '';
  mensaje = '';

  get esMia(): boolean {
    const t = this.trueque;
    return !!t && t.usuarioId === this.truequesService.usuarioActualId();
  }

  // envia la solicitud de trueque y avisa al dueño de la publicacion
  async solicitarTrueque(): Promise<void> {
    const t = this.trueque;
    if (!t) {
      return;
    }
    const error = await this.truequesService.solicitarTrueque(t.id, this.ofrezco);
    if (error) {
      this.mensaje = error;
      return;
    }

    this.mensaje = 'Solicitud enviada. El dueño recibirá una notificación.';
    this.ofrezco = '';
  }

  // reportar la publicacion
  motivosReporte = [
    'Contenido inapropiado',
    'Posible estafa',
    'Publicación engañosa',
    'Artículo prohibido',
    'Otro motivo',
  ];
  reportando = false;
  motivoReporte = '';
  mensajeReporte = '';

  abrirReporte(): void {
    this.reportando = !this.reportando;
    this.mensajeReporte = '';
  }

  async enviarReporte(): Promise<void> {
    const t = this.trueque;
    if (!t) {
      return;
    }
    if (!this.motivoReporte) {
      this.mensajeReporte = 'Elige el motivo del reporte.';
      return;
    }

    const error = await this.truequesService.reportarPublicacion(t.id, this.motivoReporte);
    if (error) {
      this.mensajeReporte = error;
      return;
    }

    this.mensajeReporte = 'Gracias, recibimos tu reporte. Un administrador lo va a revisar.';
    this.reportando = false;
    this.motivoReporte = '';
  }

  irAEditar(): void {
    const t = this.trueque;
    if (t) this.router.navigate(['/trueque', t.id, 'editar'], { queryParamsHandling: 'preserve' });
  }

  // clase del badge segun el tipo
  claseBadge(tipo: TipoPublicacion): string {
    return this.truequesService.claseBadge(tipo);
  }

  // abre WhatsApp con el dueño. XchanGo no tiene chat interno
  contactarPorWhatsApp(): void {
    const t = this.trueque;
    if (!t) {
      return;
    }
    const enlace = this.truequesService.enlaceWhatsApp(t);
    if (enlace) {
      window.open(enlace, '_blank');
    } else {
      // es tu propia publicacion: no tiene sentido escribirte a ti mismo
      this.router.navigate(['/mis-publicaciones']);
    }
  }

  get imagenes(): string[] {
    if (!this.trueque) {
      return [];
    }
    if (this.trueque.imagenes && this.trueque.imagenes.length > 0) {
      return this.trueque.imagenes;
    }
    return [this.trueque.imagen];
  }

  get descripcion(): string {
    if (!this.trueque) {
      return '';
    }
    if (this.trueque.descripcion) {
      return this.trueque.descripcion;
    }
    return this.trueque.titulo + ', publicado por ' + this.trueque.autor + ' en ' + this.trueque.ciudad + '. Escríbele para conocer el estado del bien, condiciones de entrega y qué espera recibir a cambio.';
  }

  get caracteristicas(): { label: string; valor: string }[] {
    if (!this.trueque) {
      return [];
    }
    if (this.trueque.caracteristicas && this.trueque.caracteristicas.length > 0) {
      return this.trueque.caracteristicas;
    }
    return [
      { label: 'Categoría', valor: this.trueque.tipo },
      { label: 'Ubicación', valor: this.trueque.ciudad },
    ];
  }

  get intereses(): string[] {
    if (!this.trueque) {
      return [];
    }
    if (this.trueque.interesesCambio && this.trueque.interesesCambio.length > 0) {
      return this.trueque.interesesCambio;
    }
    return ['Abierto a propuestas', 'Cuéntale qué tienes para ofrecer'];
  }
}