// aviso de un trueque, no es chat (la conversacion se hace por whatsapp)
export type TipoNotificacion =
  | 'solicitud'   // alguien quiere truequear con una publicación tuya
  | 'aceptada'    // el dueño aceptó tu propuesta
  | 'rechazada'   // el dueño no aceptó tu propuesta
  | 'documento';  // el moderador revisó tu documento de verificación

export interface Notificacion {
  id: string;
  // destinatario del aviso
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  // ID del trueque o publicacion relacionada. null si el aviso es general
  referenciaId: string | null;
  leida: boolean;
  fecha: string;
}
