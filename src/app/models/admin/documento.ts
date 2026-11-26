// documento de identidad que sube el usuario para verificar la cuenta
export type EstadoDocumento = 'pendiente' | 'aprobado' | 'rechazado';

export interface Documento {
  id: string;
  usuarioId: string;
  tipoDocumento: string;
  numero: string;
  // foto del frente (texto de imagen)
  archivo: string;
  // foto de atras; vacio en los documentos viejos
  archivoReverso: string;
  fechaSubida: string;
  estado: EstadoDocumento;
  // motivo del rechazo o comentario del revisor
  observacion: string;
  // id del administrador que lo reviso. null si nadie lo ha revisado
  revisadoPor: string | null;
}

// documento con el nombre del usuario y del revisor ya resueltos
export interface DocumentoVista extends Documento {
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioAvatar: string;
  revisorNombre: string;
}
