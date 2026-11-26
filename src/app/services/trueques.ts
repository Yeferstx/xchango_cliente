import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, forkJoin } from 'rxjs';

import { API_URL, borrarToken, guardarToken, mensajeDeError } from '../config/api';
import { Usuario, nombreCompleto } from '../models/usuario.model';
import { Categoria } from '../models/categoria.model';
import {
  CLASE_BADGE_TIPO,
  ETIQUETA_TIPO,
  Publicacion,
  PublicacionVista,
  TipoPublicacion,
} from '../models/publicacion.model';
import { Trueque, TruequeVista } from '../models/trueque.model';
import { Notificacion } from '../models/notificacion.model';
import { AvisoUbicacion } from '../models/aviso-ubicacion.model';

const CLAVE_SESION = 'xchango_sesion';

const IMAGEN_RESPALDO = 'https://placehold.co/600x450/ece2c9/1f1b16?text=Sin+imagen';

const AVATAR_DEFECTO = '/Logo-xchango/avatar-defecto.png';

export interface CategoriaSidebar {
  id: string;
  nombre: string;
  icono: string;
}

// lo que mandan los formularios de crear y editar publicacion
export interface DatosPublicacion {
  tipo: TipoPublicacion;
  categoriaId: string;
  titulo: string;
  descripcion: string;
  ofreces: string;
  buscas: string;
  municipio?: string;
  barrio?: string;
  cantidadDisponible?: string;
  disponibilidad?: string;
  imagenes?: string[];
  // solo al crear: la publicacion puede salir activa o pausada
  estado?: 'activa' | 'pausada';
}

// servicio principal, todo viene del MID
@Injectable({ providedIn: 'root' })
export class TruequesService {
  private http = inject(HttpClient);

  private listaUsuarios = signal<Usuario[]>([]);
  private listaCategorias = signal<Categoria[]>([]);
  private listaPublicaciones = signal<Publicacion[]>([]);
  private listaTrueques = signal<Trueque[]>([]);
  private listaNotificaciones = signal<Notificacion[]>([]);
  private listaAvisos = signal<AvisoUbicacion[]>([]);
  private favoritos = signal<string[]>([]);
  private estaCargando = signal(false);
  private mensajeError = signal('');
  private datosListos = signal(false);
  private pidiendo = false;
  private carga: Promise<void> | null = null;

  cargando = this.estaCargando.asReadonly();
  error = this.mensajeError.asReadonly();
  listo = this.datosListos.asReadonly();
  usuarios = this.listaUsuarios.asReadonly();
  categorias = this.listaCategorias.asReadonly();

  // id del usuario que inicio sesion. null = nadie
  usuarioActualId = signal<string | null>(this.leerSesion());

  usuarioActual = computed(() => {
    const lista = this.listaUsuarios();
    for (const u of lista) {
      if (u.id === this.usuarioActualId()) {
        return u;
      }
    }
    return null;
  });

  autenticado = computed(() => this.usuarioActualId() !== null);

  categoriasSidebar = computed(() => {
    const lista: CategoriaSidebar[] = [{ id: 'todos', nombre: 'Todos', icono: 'grid' }];
    for (const c of this.listaCategorias()) {
      lista.push({ id: c.id, nombre: c.nombre, icono: c.icono });
    }
    return lista;
  });

  // cargar datos del MID

  // se llama desde el ngOnInit de cada pagina, solo carga una vez
  cargar(): void {
    if (this.datosListos() || this.pidiendo) {
      return;
    }
    this.carga = this.cargarTodo();
  }

  // para las pantallas que necesitan los datos listos antes de seguir
  async esperarDatos(): Promise<void> {
    this.cargar();
    if (this.carga) {
      await this.carga;
    }
  }

  private async cargarTodo(): Promise<void> {
    this.pidiendo = true;
    this.estaCargando.set(true);
    this.mensajeError.set('');

    try {
      await this.traerDatos();
      this.datosListos.set(true);
    } catch (e) {
      this.mensajeError.set('No se pudieron cargar los datos. Revisa que el MID esté encendido.');
      console.log('error cargando datos del MID', e);
    }

    this.estaCargando.set(false);
    this.pidiendo = false;
  }

  // vuelve a pedir los datos sin mostrar el cargando (despues de cambios)
  async refrescar(): Promise<void> {
    try {
      await this.traerDatos();
    } catch {
      // si falla se quedan los datos que ya habia
    }
  }

  private async traerDatos(): Promise<void> {
    const publicos: any = await firstValueFrom(
      forkJoin({
        usuarios: this.http.get(API_URL + '/usuarios'),
        categorias: this.http.get(API_URL + '/categorias'),
        publicaciones: this.http.get(API_URL + '/publicaciones'),
        avisos: this.http.get(API_URL + '/avisos-ubicacion'),
      }),
    );

    this.listaUsuarios.set(publicos.usuarios);
    this.listaCategorias.set(publicos.categorias);
    this.listaPublicaciones.set(publicos.publicaciones);
    this.listaAvisos.set(publicos.avisos);

    if (!this.usuarioActualId()) {
      this.listaTrueques.set([]);
      this.listaNotificaciones.set([]);
      this.favoritos.set([]);
      return;
    }

    const privados: any = await firstValueFrom(
      forkJoin({
        trueques: this.http.get(API_URL + '/trueques'),
        notificaciones: this.http.get(API_URL + '/notificaciones'),
        favoritos: this.http.get(API_URL + '/favoritos'),
      }),
    );

    this.listaTrueques.set(privados.trueques);
    this.listaNotificaciones.set(privados.notificaciones);
    this.favoritos.set(privados.favoritos);
  }

  private leerSesion(): string | null {
    try {
      return localStorage.getItem(CLAVE_SESION);
    } catch {
      return null;
    }
  }

  private guardarSesion(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(CLAVE_SESION, id);
      } else {
        localStorage.removeItem(CLAVE_SESION);
      }
    } catch {
      // sin almacenamiento la sesion dura hasta recargar
    }
  }

  // sesion

  // se llama despues de verificar el PIN, pide el perfil al MID
  // devuelve null si entro bien, o el mensaje de error
  async iniciarSesion(): Promise<string | null> {
    try {
      const usuario: any = await firstValueFrom(this.http.get(API_URL + '/auth/perfil'));

      if (usuario.estado === 'suspendido') {
        borrarToken();
        return 'Tu cuenta está suspendida.';
      }

      await this.abrirSesion(usuario);
      return null;
    } catch (e) {
      borrarToken();
      return mensajeDeError(e);
    }
  }

  // devuelve null si registro bien, o el mensaje de error
  async registrar(datos: {
    nombre: string;
    apellido: string;
    fechaNacimiento: string;
    email: string;
    telefono: string;
    ubicacion: string;
    direccion: string;
    barrio: string;
    avatar?: string;
  }): Promise<string | null> {
    if (!datos.nombre.trim()) {
      return 'El nombre es obligatorio.';
    }
    if (!datos.apellido.trim()) {
      return 'El apellido es obligatorio.';
    }

    let ubicacion = datos.ubicacion;
    if (!ubicacion) {
      ubicacion = 'Yopal';
    }

    const cuerpo: any = {
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      fechaNacimiento: datos.fechaNacimiento,
      email: datos.email.trim().toLowerCase(),
      telefono: datos.telefono.replace(/\D/g, ''),
      ubicacion: ubicacion,
      direccion: datos.direccion.trim(),
      barrio: datos.barrio.trim(),
    };

    if (datos.avatar) {
      cuerpo.avatar = datos.avatar;
    }

    try {
      const respuesta: any = await firstValueFrom(this.http.post(API_URL + '/auth/registro', cuerpo));

      guardarToken(respuesta.token);
      await this.abrirSesion(respuesta.usuario);
      return null;
    } catch (e) {
      return mensajeDeError(e);
    }
  }

  private async abrirSesion(usuario: Usuario): Promise<void> {
    this.usuarioActualId.set(usuario.id);
    this.guardarSesion(usuario.id);
    await this.cargarTodo();
  }

  // elimina la cuenta del usuario, devuelve null si salio bien o el mensaje de error
  async eliminarCuenta(): Promise<string | null> {
    try {
      await firstValueFrom(this.http.delete(API_URL + '/usuarios/perfil'));
      this.cerrarSesion();
      return null;
    } catch (e) {
      return mensajeDeError(e);
    }
  }

  // reporta una publicacion para que el administrador la revise
  async reportarPublicacion(publicacionId: string, motivo: string): Promise<string | null> {
    try {
      await firstValueFrom(
        this.http.post(API_URL + '/reportes', { publicacionId: publicacionId, motivo: motivo }),
      );
      return null;
    } catch (e) {
      return mensajeDeError(e);
    }
  }

  cerrarSesion(): void {
    borrarToken();
    this.usuarioActualId.set(null);
    this.guardarSesion(null);
    this.listaTrueques.set([]);
    this.listaNotificaciones.set([]);
    this.favoritos.set([]);
  }

  // actualiza los datos del perfil, devuelve null si guardo bien o el mensaje de error
  async actualizarPerfil(cambios: {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    ubicacion?: string;
    direccion?: string;
    barrio?: string;
    descripcion?: string;
    avatar?: string;
  }): Promise<string | null> {
    const id = this.usuarioActualId();
    if (!id) {
      return 'Inicia sesión para cambiar tu perfil.';
    }

    try {
      const usuario: any = await firstValueFrom(this.http.put(API_URL + '/usuarios/perfil', cambios));

      const nuevaLista: Usuario[] = [];
      for (const u of this.listaUsuarios()) {
        if (u.id === id) {
          nuevaLista.push(usuario);
        } else {
          nuevaLista.push(u);
        }
      }
      this.listaUsuarios.set(nuevaLista);
      return null;
    } catch (e) {
      return mensajeDeError(e);
    }
  }

  // busca un usuario por su id
  private buscarUsuario(id: string): Usuario | null {
    for (const u of this.listaUsuarios()) {
      if (u.id === id) {
        return u;
      }
    }
    return null;
  }

  // publicaciones

  // une cada publicacion con su autor y su categoria para mostrarla
  todas = computed(() => {
    const lista: PublicacionVista[] = [];

    for (const p of this.listaPublicaciones()) {
      const vista: any = Object.assign({}, p);
      const autor = this.buscarUsuario(p.usuarioId);

      let nombreCategoria = 'Sin categoría';
      for (const c of this.listaCategorias()) {
        if (c.id === p.categoriaId) {
          nombreCategoria = c.nombre;
        }
      }

      // cuantas solicitudes de trueque tiene la publicacion
      let propuestas = 0;
      for (const t of this.listaTrueques()) {
        if (t.publicacionId === p.id) {
          propuestas = propuestas + 1;
        }
      }

      vista.autor = 'Usuario desconocido';
      vista.avatar = AVATAR_DEFECTO;
      vista.telefono = '';
      if (autor) {
        vista.autor = nombreCompleto(autor);
        if (autor.avatar) {
          vista.avatar = autor.avatar;
        }
        if (autor.telefono) {
          vista.telefono = autor.telefono;
        }
      }

      // un bien digital no tiene ubicacion porque se entrega de una vez
      if (p.tipo === 'bien_digital') {
        vista.ciudad = 'Entrega digital';
      } else {
        vista.ciudad = p.municipio;
      }

      vista.imagen = IMAGEN_RESPALDO;
      if (p.imagenes.length > 0) {
        vista.imagen = p.imagenes[0];
      }

      vista.categoria = nombreCategoria;
      vista.favorito = this.favoritos().includes(p.id);
      vista.tipoEtiqueta = ETIQUETA_TIPO[p.tipo];
      vista.claseBadge = CLASE_BADGE_TIPO[p.tipo];
      vista.caracteristicas = this.fichaTecnica(p, nombreCategoria);
      vista.interesesCambio = this.separarIntereses(p.buscas);
      vista.publicadoHace = this.textoRelativo(p.fechaCreacion);
      vista.propuestas = propuestas;

      lista.push(vista);
    }

    return lista;
  });

  publicaciones = computed(() => this.todas().filter((p) => p.estado !== 'eliminada'));

  misPublicaciones = computed(() => {
    const id = this.usuarioActualId();
    if (!id) {
      return [];
    }
    return this.todas().filter((p) => p.usuarioId === id && p.estado !== 'eliminada');
  });

  publicacionesFavoritas = computed(() => this.publicaciones().filter((p) => p.favorito));

  obtenerPorId(id: string): PublicacionVista | undefined {
    return this.todas().find((p) => p.id === id);
  }

  // crea la publicacion, devuelve su id o el mensaje de error
  async crearPublicacion(datos: DatosPublicacion): Promise<{ id: string } | { error: string }> {
    if (!this.usuarioActualId()) {
      return { error: 'Inicia sesión para publicar.' };
    }

    try {
      const nueva: any = await firstValueFrom(this.http.post(API_URL + '/publicaciones', datos));

      const nuevaLista: Publicacion[] = [nueva];
      for (const p of this.listaPublicaciones()) {
        nuevaLista.push(p);
      }
      this.listaPublicaciones.set(nuevaLista);

      this.refrescar();
      return { id: nueva.id };
    } catch (e) {
      return { error: mensajeDeError(e) };
    }
  }

  // devuelve null si guardo bien, o el mensaje de error
  async actualizarPublicacion(id: string, datos: DatosPublicacion): Promise<string | null> {
    try {
      const editada: any = await firstValueFrom(this.http.put(API_URL + '/publicaciones/' + id, datos));
      this.cambiarPublicacion(id, editada);
      return null;
    } catch (e) {
      return mensajeDeError(e);
    }
  }

  // el MID no borra el registro, le cambia el estado a eliminada
  async eliminarPublicacion(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(API_URL + '/publicaciones/' + id));
      this.cambiarEstado(id, 'eliminada');
      this.refrescar();
      return true;
    } catch {
      return false;
    }
  }

  // pausa una publicacion activa, o reactiva una pausada
  async alternarEstadoPublicacion(id: string): Promise<void> {
    try {
      const respuesta: any = await firstValueFrom(
        this.http.patch(API_URL + '/publicaciones/' + id + '/estado', {}),
      );
      this.cambiarEstado(id, respuesta.estado);
    } catch {
      this.refrescar();
    }
  }

  // reemplaza una publicacion de la lista por la que mando el MID
  private cambiarPublicacion(id: string, nueva: Publicacion): void {
    const nuevaLista: Publicacion[] = [];
    for (const p of this.listaPublicaciones()) {
      if (p.id === id) {
        nuevaLista.push(nueva);
      } else {
        nuevaLista.push(p);
      }
    }
    this.listaPublicaciones.set(nuevaLista);
  }

  // cambia solo el estado de una publicacion
  private cambiarEstado(id: string, estado: string): void {
    for (const p of this.listaPublicaciones()) {
      if (p.id === id) {
        const copia: any = Object.assign({}, p);
        copia.estado = estado;
        this.cambiarPublicacion(id, copia);
      }
    }
  }

  etiquetaTipo(tipo: TipoPublicacion): string {
    return ETIQUETA_TIPO[tipo];
  }

  // usa solo clases que ya existen en el CSS del proyecto
  claseBadge(tipo: TipoPublicacion): string {
    const clase = CLASE_BADGE_TIPO[tipo];
    if (clase) {
      return clase;
    }
    return 'badge';
  }

  calificacionDe(usuarioId: string): number {
    const usuario = this.buscarUsuario(usuarioId);
    if (usuario && usuario.calificacion) {
      return usuario.calificacion;
    }
    return 0;
  }

  private fichaTecnica(p: Publicacion, categoria: string): { label: string; valor: string }[] {
    const filas = [
      { label: 'Tipo', valor: ETIQUETA_TIPO[p.tipo] },
      { label: 'Categoría', valor: categoria },
      { label: 'Ofrece', valor: p.ofreces },
      { label: 'Busca', valor: p.buscas },
    ];

    if (p.tipo === 'bien_fisico') {
      filas.push({ label: 'Municipio', valor: p.municipio });
      filas.push({ label: 'Barrio', valor: p.barrio });
      filas.push({ label: 'Cantidad disponible', valor: p.cantidadDisponible });
      filas.push({ label: 'Disponibilidad', valor: p.disponibilidad });
    } else if (p.tipo === 'servicio') {
      filas.push({ label: 'Municipio', valor: p.municipio });
      filas.push({ label: 'Cantidad disponible', valor: p.cantidadDisponible });
      filas.push({ label: 'Disponibilidad', valor: p.disponibilidad });
    } else {
      filas.push({ label: 'Entrega', valor: 'Inmediata / digital' });
    }

    return filas;
  }

  // separa lo que busca por coma o por " o "
  // no se usa \b porque no reconoce la ñ y partia "Diseño"
  private separarIntereses(buscas: string): string[] {
    const partes: string[] = [];
    for (const parte of buscas.split(/\s*,\s*|\s+o\s+/i)) {
      if (parte.trim().length > 0) {
        partes.push(parte.trim());
      }
    }
    if (partes.length === 0) {
      partes.push('Abierto a propuestas');
    }
    return partes;
  }

  private textoRelativo(fecha: string): string {
    const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
    if (dias <= 0) {
      return 'Publicado hoy';
    }
    if (dias === 1) {
      return 'Publicado ayer';
    }
    return 'Publicado hace ' + dias + ' días';
  }

  // trueques

  // une cada trueque con los nombres de las dos personas
  trueques = computed(() => {
    const lista: TruequeVista[] = [];

    for (const t of this.listaTrueques()) {
      const vista: any = Object.assign({}, t);
      const solicitante = this.buscarUsuario(t.solicitanteId);
      const propietario = this.buscarUsuario(t.propietarioId);

      vista.solicitanteNombre = 'Usuario desconocido';
      vista.solicitanteAvatar = AVATAR_DEFECTO;
      vista.solicitanteTelefono = '';
      if (solicitante) {
        vista.solicitanteNombre = nombreCompleto(solicitante);
        if (solicitante.avatar) {
          vista.solicitanteAvatar = solicitante.avatar;
        }
        if (solicitante.telefono) {
          vista.solicitanteTelefono = solicitante.telefono;
        }
      }

      vista.propietarioNombre = 'Usuario desconocido';
      vista.propietarioAvatar = AVATAR_DEFECTO;
      vista.propietarioTelefono = '';
      if (propietario) {
        vista.propietarioNombre = nombreCompleto(propietario);
        if (propietario.avatar) {
          vista.propietarioAvatar = propietario.avatar;
        }
        if (propietario.telefono) {
          vista.propietarioTelefono = propietario.telefono;
        }
      }

      vista.publicacionTitulo = 'Publicación no disponible';
      for (const p of this.listaPublicaciones()) {
        if (p.id === t.publicacionId) {
          vista.publicacionTitulo = p.titulo;
        }
      }

      lista.push(vista);
    }

    return lista;
  });

  truequesRecibidos = computed(() =>
    this.trueques().filter((t) => t.propietarioId === this.usuarioActualId()),
  );

  truequesEnviados = computed(() =>
    this.trueques().filter((t) => t.solicitanteId === this.usuarioActualId()),
  );

  solicitudesPendientes = computed(() => {
    let total = 0;
    for (const t of this.truequesRecibidos()) {
      if (t.estado === 'pendiente') {
        total = total + 1;
      }
    }
    return total;
  });

  // devuelve null si la solicitud se envio, o el mensaje de error
  async solicitarTrueque(publicacionId: string, ofrece: string): Promise<string | null> {
    if (!this.usuarioActualId()) {
      return 'Inicia sesión para proponer un trueque.';
    }

    let texto = ofrece.trim();
    if (!texto) {
      texto = 'Propuesta por acordar';
    }

    try {
      const nuevo: any = await firstValueFrom(
        this.http.post(API_URL + '/trueques', { publicacionId: publicacionId, ofrece: texto }),
      );

      const nuevaLista: Trueque[] = [nuevo];
      for (const t of this.listaTrueques()) {
        nuevaLista.push(t);
      }
      this.listaTrueques.set(nuevaLista);
      return null;
    } catch (e) {
      return mensajeDeError(e);
    }
  }

  async aceptarTrueque(truequeId: string): Promise<void> {
    await this.accionTrueque(truequeId, 'aceptar', {});
  }

  async rechazarTrueque(truequeId: string): Promise<void> {
    await this.accionTrueque(truequeId, 'rechazar', {});
  }

  // cada parte confirma, cuando confirman las dos queda completado
  async confirmarTrueque(truequeId: string): Promise<void> {
    const actualizado = await this.accionTrueque(truequeId, 'confirmar', {});

    // al completarse cambian la publicacion y los contadores del usuario
    if (actualizado && actualizado.estado === 'completado') {
      this.refrescar();
    }
  }

  // nota de 1 a 5 que pone el usuario que tiene la sesion
  async calificarTrueque(truequeId: string, nota: number): Promise<void> {
    if (nota < 1 || nota > 5) {
      return;
    }

    await this.accionTrueque(truequeId, 'calificar', { nota: nota });
    this.refrescar();
  }

  // nota que ya puso el usuario en ese trueque (0 si todavia no califica)
  miCalificacion(t: TruequeVista): number {
    const yo = this.usuarioActualId();
    if (t.solicitanteId === yo && t.calificacionSolicitante) {
      return t.calificacionSolicitante;
    }
    if (t.propietarioId === yo && t.calificacionPropietario) {
      return t.calificacionPropietario;
    }
    return 0;
  }

  // manda la accion al MID y cambia el trueque con lo que responde
  private async accionTrueque(truequeId: string, accion: string, cuerpo: object): Promise<Trueque | null> {
    try {
      const actualizado: any = await firstValueFrom(
        this.http.patch(API_URL + '/trueques/' + truequeId + '/' + accion, cuerpo),
      );

      const nuevaLista: Trueque[] = [];
      for (const t of this.listaTrueques()) {
        if (t.id === truequeId) {
          nuevaLista.push(actualizado);
        } else {
          nuevaLista.push(t);
        }
      }
      this.listaTrueques.set(nuevaLista);
      return actualizado;
    } catch {
      this.refrescar();
      return null;
    }
  }

  // notificaciones (avisos de una sola via, no es un chat)

  notificaciones = computed(() => {
    const id = this.usuarioActualId();
    if (!id) {
      return [];
    }
    const lista = this.listaNotificaciones().filter((n) => n.usuarioId === id);
    lista.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return lista;
  });

  notificacionesSinLeer = computed(() => {
    let total = 0;
    for (const n of this.notificaciones()) {
      if (!n.leida) {
        total = total + 1;
      }
    }
    return total;
  });

  // aviso del municipio elegido, viene del MID (/avisos-ubicacion)
  // solo es para mostrar, no se guarda ni se marca como leido
  avisoDeUbicacion(municipio: string): AvisoUbicacion | undefined {
    let general: AvisoUbicacion | undefined = undefined;
    for (const a of this.listaAvisos()) {
      if (a.municipio === municipio) {
        return a;
      }
      if (a.municipio === '' && !general) {
        general = a;
      }
    }
    return general;
  }

  marcarNotificacionLeida(id: string): void {
    const nuevaLista: Notificacion[] = [];
    for (const n of this.listaNotificaciones()) {
      const copia = Object.assign({}, n);
      if (n.id === id) {
        copia.leida = true;
      }
      nuevaLista.push(copia);
    }
    this.listaNotificaciones.set(nuevaLista);

    this.http.patch(API_URL + '/notificaciones/' + id + '/leida', {}).subscribe({
      error: () => this.refrescar(),
    });
  }

  marcarTodasLeidas(): void {
    const yo = this.usuarioActualId();
    const nuevaLista: Notificacion[] = [];
    for (const n of this.listaNotificaciones()) {
      const copia = Object.assign({}, n);
      if (n.usuarioId === yo) {
        copia.leida = true;
      }
      nuevaLista.push(copia);
    }
    this.listaNotificaciones.set(nuevaLista);

    this.http.patch(API_URL + '/notificaciones/leidas', {}).subscribe({
      error: () => this.refrescar(),
    });
  }

  // whatsapp: XchanGo no tiene chat interno

  enlaceWhatsApp(publicacion: PublicacionVista): string | null {
    if (!publicacion.telefono) {
      return null;
    }
    if (publicacion.usuarioId === this.usuarioActualId()) {
      return null;
    }

    let yo = 'un usuario de XchanGo';
    const actual = this.usuarioActual();
    if (actual) {
      yo = nombreCompleto(actual);
    }

    const texto =
      'Hola ' + publicacion.autor + ', soy ' + yo + '. ' +
      'Vi tu publicación "' + publicacion.titulo + '" en XchanGo y quiero proponerte un trueque. ' +
      'Tú buscas: ' + publicacion.buscas + '. ¿Lo hablamos?';

    return this.armarEnlace(publicacion.telefono, texto);
  }

  enlaceWhatsAppTrueque(t: TruequeVista): string | null {
    // si yo soy el dueño le escribo al que pidio, si no al dueño
    let telefono = t.propietarioTelefono;
    let destino = t.propietarioNombre;
    if (t.propietarioId === this.usuarioActualId()) {
      telefono = t.solicitanteTelefono;
      destino = t.solicitanteNombre;
    }

    if (!telefono) {
      return null;
    }

    const texto =
      'Hola ' + destino + ', te escribo desde XchanGo por el trueque de "' +
      t.publicacionTitulo + '". Ofrezco: ' + t.ofrece + '.';

    return this.armarEnlace(telefono, texto);
  }

  abrirWhatsApp(enlace: string | null): void {
    if (enlace) {
      window.open(enlace, '_blank');
    }
  }

  // le pone el indicativo de Colombia al numero
  private armarEnlace(telefono: string, texto: string): string {
    let numero = telefono.replace(/\D/g, '');
    if (!numero.startsWith('57')) {
      numero = '57' + numero;
    }
    return 'https://wa.me/' + numero + '?text=' + encodeURIComponent(texto);
  }

  // favoritos

  alternarFavorito(publicacion: { id: string }): void {
    const copia = this.favoritos().slice();
    const posicion = copia.indexOf(publicacion.id);
    if (posicion >= 0) {
      copia.splice(posicion, 1);
    } else {
      copia.push(publicacion.id);
    }
    this.favoritos.set(copia);

    // sin sesion el favorito solo queda en pantalla
    if (!this.usuarioActualId()) {
      return;
    }

    this.http.post(API_URL + '/favoritos/' + publicacion.id, {}).subscribe({
      error: () => this.refrescar(),
    });
  }

  esFavorito(id: string): boolean {
    return this.favoritos().includes(id);
  }
}
