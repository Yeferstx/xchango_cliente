// accion de moderacion que queda en el historial (se guardan ids, no nombres)
export interface AccionAdmin {
  id: string;
  usuarioId: string;
  adminId: string;
  accion: string;
  descripcion: string;
  fecha: string;
}

// accion con los nombres ya resueltos para mostrarla en pantalla
export interface AccionAdminVista extends AccionAdmin {
  usuarioNombre: string;
  administrador: string;
}
