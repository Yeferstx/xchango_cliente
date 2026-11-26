// publicacion de XchanGo, los campos cambian segun el tipo:
//  - bien_fisico: municipio, barrio, cantidad y disponibilidad
//  - servicio: municipio, cantidad y disponibilidad
//  - bien_digital: solo ofreces y buscas

export type TipoPublicacion = 'bien_fisico' | 'servicio' | 'bien_digital';
export type EstadoPublicacion = 'activa' | 'pausada' | 'finalizada' | 'eliminada';

interface PublicacionBase {
  id: string;
  usuarioId: string;
  categoriaId: string;
  titulo: string;
  descripcion: string;
  // que entrega el dueño
  ofreces: string;
  // que espera recibir a cambio
  buscas: string;
  imagenes: string[];
  estado: EstadoPublicacion;
  vistas: number;
  fechaCreacion: string;
  // HU32: igual a fechaCreacion si nunca se edito
  fechaModificacion: string;
}

// bien fisico: municipio + barrio, y cantidad en unidades
export interface PublicacionBienFisico extends PublicacionBase {
  tipo: 'bien_fisico';
  municipio: string;
  barrio: string;
  // ej.: "1 unidad", "3 unidades"
  cantidadDisponible: string;
  disponibilidad: string;
}

// servicio: solo municipio (sin barrio); cantidad en horas, sesiones o cupos
export interface PublicacionServicio extends PublicacionBase {
  tipo: 'servicio';
  municipio: string;
  // ej.: "5 sesiones", "4 horas". no son unidades fisicas
  cantidadDisponible: string;
  // campo clave de un servicio. Ej.: "Lunes y miercoles de 4:00 PM a 7:00 PM"
  disponibilidad: string;
}

// bien digital: entrega inmediata. Sin ubicacion, cantidad ni disponibilidad
export interface PublicacionBienDigital extends PublicacionBase {
  tipo: 'bien_digital';
}

export type Publicacion =
  | PublicacionBienFisico
  | PublicacionServicio
  | PublicacionBienDigital;

export const ETIQUETA_TIPO: any = {
  bien_fisico: 'Bien físico',
  servicio: 'Servicio',
  bien_digital: 'Bien digital',
};

// clase del badge segun el tipo
export const CLASE_BADGE_TIPO: any = {
  bien_fisico: 'badge badge--bienes',
  servicio: 'badge badge--servicios',
  bien_digital: 'badge badge--electronicos',
};

// publicacion con el autor y la categoria ya unidos para las vistas
export type PublicacionVista = Publicacion & {
  autor: string;
  avatar: string;
  telefono: string;
  // municipio, o "Entrega digital" si el tipo es bien_digital
  ciudad: string;
  // NOMBRE de la categoria (para mostrar). El ID sigue en 'categoriaId'
  categoria: string;
  // primera imagen, con respaldo si la publicacion no tiene ninguna
  imagen: string;
  favorito: boolean;
  // texto legible del tipo: "Bien fisico", "Servicio", "Bien digital"
  tipoEtiqueta: string;
  claseBadge: string;
  // ficha tecnica ya adaptada al tipo de publicacion
  caracteristicas: { label: string; valor: string }[];
  // lo que el dueño busca, separado en etiquetas
  interesesCambio: string[];
  publicadoHace: string;
  anio?: number;
  // cantidad de solicitudes de trueque recibidas
  propuestas: number;
};

export const esBienFisico = (p: Publicacion): p is PublicacionBienFisico =>
  p.tipo === 'bien_fisico';

export const esServicio = (p: Publicacion): p is PublicacionServicio =>
  p.tipo === 'servicio';

export const esBienDigital = (p: Publicacion): p is PublicacionBienDigital =>
  p.tipo === 'bien_digital';

// true si el tipo maneja ubicacion fisica (bien_fisico o servicio)
export const tieneUbicacion = (
  p: Publicacion
): p is PublicacionBienFisico | PublicacionServicio => p.tipo !== 'bien_digital';
