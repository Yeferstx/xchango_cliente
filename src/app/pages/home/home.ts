import { LogoXchangoComponent } from '../../components/logo-xchango/logo-xchango';
import { CommonModule } from '@angular/common';
import { MUNICIPIOS_CASANARE } from '../../shared/municipios-casanare';
import { AvisoUbicacion } from '../../models/aviso-ubicacion.model';
import { ModalDetalleTruequeComponent } from '../../layout/modal-detalle-trueque/modal-detalle-trueque';
import { Component, OnInit, HostListener, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Categoria } from '../../models/categoria.model';
import { PublicacionVista, TipoPublicacion } from '../../models/publicacion.model';
import { TruequesService } from '../../services/trueques';
import { nombreCompleto } from '../../models/usuario.model';

type FiltroTrueque = 'todos' | 'bienes' | 'servicios' | 'digitales';

// cada pestaña del home corresponde a un tipo real de publicacion
const TIPO_POR_FILTRO: any = {
  bienes: 'bien_fisico',
  servicios: 'servicio',
  digitales: 'bien_digital',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [LogoXchangoComponent, ModalDetalleTruequeComponent, CommonModule, FormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  busqueda = '';
  filtroActivo: FiltroTrueque = 'bienes';
  categoriaSeleccionada = 'todos';
  mostrarSoloFavoritos = false;

  // municipio elegido. Vacio = todo Casanare
  municipioSeleccionado = '';

  // municipios de Casanare, del catalogo compartido del proyecto
  municipios: string[] = MUNICIPIOS_CASANARE;

  // categorias para el desplegable (reemplazan la barra lateral)
  get listaCategorias(): Categoria[] {
    return this.truequesService.categorias();
  }

  // true cuando el panel de categorias esta desplegado
  categoriasAbiertas = false;

  get textoCategoria(): string {
    if (this.categoriaSeleccionada === 'todos') {
      return 'Todas las categorías';
    }
    for (const c of this.listaCategorias) {
      if (c.id === this.categoriaSeleccionada) {
        return c.nombre;
      }
    }
    return 'Todas las categorías';
  }

  alternarCategorias(): void {
    this.categoriasAbiertas = !this.categoriasAbiertas;
  }

  // true cuando el panel de ubicacion esta desplegado
  ubicacionAbierta = false;

  // texto que muestra el boton de ubicacion
  get textoUbicacion(): string {
    return this.municipioSeleccionado || 'Todo Casanare';
  }

  // aviso del municipio, viene del MID y solo es informativo
  get avisoUbicacion(): AvisoUbicacion | undefined {
    return this.truequesService.avisoDeUbicacion(this.municipioSeleccionado);
  }

  alternarUbicacion(): void {
    this.ubicacionAbierta = !this.ubicacionAbierta;
  }

  cerrarUbicacion(): void {
    this.ubicacionAbierta = false;
  }

  // viene de un computed, no armar un array nuevo aqui o el sidebar se vuelve a pintar

  beneficios = [
    {
      titulo: 'Trueques seguros',
      descripcion: 'Perfiles verificados y comunidad confiable.',
      icono: 'shield',
    },
    {
      titulo: 'Comunidad activa',
      descripcion: 'Miles de personas intercambiando cada día.',
      icono: 'users',
    },
    {
      titulo: 'Rápido y fácil',
      descripcion: 'Publica tu trueque en minutos y recibe propuestas.',
      icono: 'bolt',
    },
    {
      titulo: 'Atención 24/7',
      descripcion: 'Estamos para ayudarte en todo momento.',
      icono: 'chat',
    },
  ];

  // avisos sin leer del usuario
  get notificaciones(): number {
    return this.truequesService.notificacionesSinLeer();
  }

  // foto del usuario en sesion, para el boton del header
  get avatarUrl(): string {
    const usuario = this.truequesService.usuarioActual();
    if (usuario && usuario.avatar) {
      return usuario.avatar;
    }
    return '/Logo-xchango/avatar-defecto.png';
  }

  // true si hay una cuenta activa (no es una visita de invitado)
  get estaAutenticado(): boolean {
    return this.truequesService.autenticado();
  }

  // nombre del usuario en sesion, para el mini menu de perfil
  get nombreUsuario(): string {
    const usuario = this.truequesService.usuarioActual();
    if (usuario) {
      return nombreCompleto(usuario);
    }
    return 'Invitado';
  }

  // MINI MENU DE PERFIL Y NOTIFICACIONES (header)

  menuPerfilAbierto = signal(false);
  notificacionesAbiertas = signal(false);

  abrirMenuPerfil(): void {
    this.notificacionesAbiertas.set(false);
    this.menuPerfilAbierto.update((v) => !v);
  }

  abrirNotificaciones(): void {
    this.menuPerfilAbierto.set(false);
    this.notificacionesAbiertas.update((v) => !v);
  }

  // ultimos avisos para el mini panel de la campana ("solo para ver")
  get ultimasNotificaciones() {
    return this.truequesService.notificaciones().slice(0, 4);
  }

  // cierra los menus del header y el de ubicacion al hacer clic en cualquier otro lugar
  @HostListener('document:click')
  cerrarMenusHeader(): void {
    this.menuPerfilAbierto.set(false);
    this.notificacionesAbiertas.set(false);
    this.cerrarUbicacion();
  }

  cerrarSesion(): void {
    this.truequesService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  // el footer solo aparece (y se queda fijo abajo) tras hacer scroll
  footerVisible = signal(false);

  moverRejilla(evento: Event): void {
    const rejilla: any = evento.target;
    if (rejilla.scrollTop > 16) {
      this.footerVisible.set(true);
    }
  }

  constructor(
    private route: ActivatedRoute,
    private truequesService: TruequesService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.seleccionarFiltro('todos');
      this.busqueda = params.get('buscar') || '';
      const filtro = params.get('filtro');
      if (filtro === 'favoritos') {
        this.verSoloFavoritos();
      }
      if (filtro === 'servicios') {
        this.seleccionarFiltro('servicios');
      }
    });
    this.truequesService.cargar();
  }

  // catalogo visible, ya resuelto contra usuarios y categorias
  get trueques(): PublicacionVista[] {
    return this.truequesService.publicaciones();
  }

  // true mientras se cargan los JSON
  get cargando(): boolean {
    return this.truequesService.cargando();
  }

  // mensaje de error si los JSON no se pudieron cargar
  get errorCarga(): string | null {
    return this.truequesService.error();
  }

  // abre WhatsApp con el dueño. XchanGo no tiene chat interno
  contactarPorWhatsApp(publicacion: PublicacionVista, evento?: Event): void {
    if (evento) {
      evento.stopPropagation();
    }
    const enlace = this.truequesService.enlaceWhatsApp(publicacion);
    if (enlace) {
      window.open(enlace, '_blank');
    }
  }

  // combina busqueda + tab (Bienes/Servicios/Digitales) + categoria del sidebar + solo-favoritos
  get truequesFiltrados(): PublicacionVista[] {
    let resultado = this.trueques;

    if (this.mostrarSoloFavoritos) {
      resultado = resultado.filter((t) => t.favorito);
    }

    // un bien digital no tiene municipio: se entrega de una vez,
    // por eso se muestra siempre sin importar el filtro de ubicacion
    if (this.municipioSeleccionado) {
      resultado = resultado.filter(
        (t) => t.tipo === 'bien_digital' || t.ciudad === this.municipioSeleccionado,
      );
    }

    if (this.filtroActivo !== 'todos') {
      const tipo = TIPO_POR_FILTRO[this.filtroActivo];
      resultado = resultado.filter((t) => t.tipo === tipo);
    }

    if (this.categoriaSeleccionada !== 'todos') {
      resultado = resultado.filter((t) => t.categoriaId === this.categoriaSeleccionada);
    }

    if (this.busqueda.trim()) {
      const termino = this.busqueda.trim().toLowerCase();
      resultado = resultado.filter(
        (t) =>
          t.titulo.toLowerCase().includes(termino) ||
          t.autor.toLowerCase().includes(termino) ||
          t.ciudad.toLowerCase().includes(termino),
      );
    }

    return resultado;
  }

  // true si hay alguna busqueda o filtro puesto
  hayFiltros(): boolean {
    if (this.busqueda.trim() || this.mostrarSoloFavoritos || this.municipioSeleccionado) {
      return true;
    }
    if (this.filtroActivo !== 'todos' || this.categoriaSeleccionada !== 'todos') {
      return true;
    }
    return false;
  }

  // true cuando se busco o filtro y salieron entre 1 y 3 publicaciones
  pocosResultados(): boolean {
    const cantidad = this.truequesFiltrados.length;
    if (this.hayFiltros() && cantidad > 0 && cantidad < 4) {
      return true;
    }
    return false;
  }

  get cantidadFavoritos(): number {
    return this.trueques.filter((t) => t.favorito).length;
  }

  // "Carlos Ospina" -> "Carlos O." para que quepa junto a la ciudad
  nombreCorto(nombre: string): string {
    const partes = nombre.trim().split(' ');
    if (partes.length < 2) {
      return nombre;
    }
    return partes[0] + ' ' + partes[1].charAt(0) + '.';
  }

  trackPorId(_indice: number, t: PublicacionVista): string {
    return t.id;
  }

  // filtra las publicaciones por municipio
  // filtra las publicaciones por municipio y cierra el panel
  seleccionarMunicipio(municipio: string): void {
    this.municipioSeleccionado = municipio;
    this.ubicacionAbierta = false;
    this.subirRejilla();
  }

  // al cambiar un filtro la lista vuelve arriba para ver los resultados desde el inicio
  subirRejilla(): void {
    const rejilla = document.querySelector('.rejilla');
    if (rejilla) {
      rejilla.scrollTop = 0;
    }
  }

  seleccionarFiltro(filtro: FiltroTrueque): void {
    this.filtroActivo = filtro;
    this.subirRejilla();

    // "Todos" limpia todo: tipo, categoria, municipio, busqueda y favoritos,
    // para que de verdad se vean todos los trueques
    if (filtro === 'todos') {
      this.categoriaSeleccionada = 'todos';
      this.municipioSeleccionado = '';
      this.mostrarSoloFavoritos = false;
      this.busqueda = '';
    }
  }

  seleccionarCategoria(id: string): void {
    this.categoriaSeleccionada = id;
    this.categoriasAbiertas = false;
    this.subirRejilla();
  }

  irAInicio(): void {
    this.mostrarSoloFavoritos = false;
    this.filtroActivo = 'todos';
    this.categoriaSeleccionada = 'todos';
    this.busqueda = '';
  }

  verSoloFavoritos(): void {
    this.mostrarSoloFavoritos = true;
    this.subirRejilla();
  }

  alternarFavorito(trueque: PublicacionVista, evento: Event): void {
    evento.stopPropagation();
    this.truequesService.alternarFavorito(trueque);
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroActivo = 'todos';
    this.categoriaSeleccionada = 'todos';
    this.municipioSeleccionado = '';
    this.mostrarSoloFavoritos = false;
    this.subirRejilla();
  }

  // clase del badge segun el tipo
  claseBadge(tipo: TipoPublicacion): string {
    return this.truequesService.claseBadge(tipo);
  }

  // abre el formulario para crear una publicacion
  publicarTrueque(): void {
    this.router.navigate(['/trueque']);
  }

  manejarErrorImagen(evento: Event): void {
    const img: any = evento.target;
    img.src = 'https://placehold.co/600x450/ece2c9/1f1b16?text=Sin+imagen';
  }

  // publicacion abierta en el modal (null = ninguna)
  detalleAbierto: string | null = null;

  irADetalle(trueque: PublicacionVista): void {
    this.detalleAbierto = trueque.id;
    // bloquea el scroll del fondo mientras el modal esta abierto
    document.body.style.overflow = 'hidden';
  }

  cerrarDetalle(): void {
    this.detalleAbierto = null;
    document.body.style.overflow = '';
  }
}
