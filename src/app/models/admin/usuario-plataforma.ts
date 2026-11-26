import { Usuario, EstadoUsuario, NivelActividad } from '../usuario.model';

// es el mismo usuario de usuario.model.ts, se deja este nombre para el panel admin
export interface UsuarioPlataforma extends Usuario {}

export type { EstadoUsuario, NivelActividad };
