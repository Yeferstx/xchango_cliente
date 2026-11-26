// publicacion que borro un moderador
export interface PublicacionEliminada {
  id: string;
  publicacionId: string;
  usuarioId: string;
  adminId: string;
  motivo: string;
  fecha: string;
}

// registro enriquecido para la pestaña "Eliminadas" del panel de moderacion
export interface PublicacionEliminadaVista extends PublicacionEliminada {
  titulo: string;
  usuarioNombre: string;
  administrador: string;
}
