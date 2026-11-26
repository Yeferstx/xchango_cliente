// trueque: solicitud de intercambio entre dos usuarios
// se negocia por whatsapp, no hay dinero

export type EstadoTrueque =
  | 'pendiente'
  | 'aceptado'
  | 'rechazado'
  | 'completado'
  | 'cancelado';

export interface Trueque {
  id: string;
  // usuario que propone el intercambio
  solicitanteId: string;
  // usuario dueño de la publicacion
  propietarioId: string;
  publicacionId: string;
  // lo que entrega el solicitante
  ofrece: string;
  // lo que el solicitante quiere recibir (normalmente el bien publicado)
  busca: string;
  estado: EstadoTrueque;
  fechaSolicitud: string;
  // fecha de cierre; null mientras el trueque siga abierto
  fechaCierre: string | null;

  // HU51: ambas partes deben confirmar para pasar a 'completado'
  confirmadoSolicitante: boolean;
  confirmadoPropietario: boolean;

  // HU53: nota de 1 a 5 que DA cada parte; null si aun no califico
  calificacionSolicitante: number | null;
  calificacionPropietario: number | null;
}

// trueque resuelto contra usuarios.json y publicaciones.json
export interface TruequeVista extends Trueque {
  solicitanteNombre: string;
  solicitanteAvatar: string;
  solicitanteTelefono: string;
  propietarioNombre: string;
  propietarioAvatar: string;
  propietarioTelefono: string;
  publicacionTitulo: string;
}

export const ETIQUETA_ESTADO_TRUEQUE: any = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};
