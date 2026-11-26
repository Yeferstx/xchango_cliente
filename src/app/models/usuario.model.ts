// usuario de la plataforma (el panel admin tambien lo usa)
export type EstadoUsuario = 'activo' | 'suspendido' | 'advertido';
export type NivelActividad = 'bajo' | 'medio' | 'alto';
// HU03, HU16: estado de verificacion de la cuenta
export type EstadoVerificacion = 'no_verificado' | 'verificado';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  // aaaa-mm-dd. No se puede cambiar despues de registrarse
  fechaNacimiento?: string;
  email: string;
  // celular colombiano de 10 digitos. Es la base del contacto por WhatsApp
  telefono: string;
  estado: EstadoUsuario;
  fechaRegistro: string;
  // municipio de Casanare donde reside el usuario
  ubicacion: string;
  // direccion de residencia y barrio
  direccion: string;
  barrio: string;
  nivelActividad: NivelActividad;
  avatar: string;

  // HU21: texto libre del perfil
  descripcion: string;
  // HU03/HU16: arranca en 'no_verificado' y pasa a 'verificado'
  verificacion: EstadoVerificacion;
  // xchanGo no usa contraseñas: el MID nunca la manda
  password?: string;

  // HU53: promedio de 1 a 5 recibido en trueques completados (0 si no tiene)
  calificacion: number;
  totalCalificaciones: number;

  // contadores derivados de los demas JSON (alimentan ranking y metricas)
  publicaciones: number;
  intercambios: number;
  reportes: number;
}

// nombre y apellido juntos, para mostrarlos en pantalla
export function nombreCompleto(usuario: { nombre: string; apellido?: string }): string {
  if (usuario.apellido) {
    return (usuario.nombre + ' ' + usuario.apellido).trim();
  }
  return usuario.nombre.trim();
}
