// en el computador se usa el MID local y publicado se usa el MID de Render
function direccionMid(): string {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:8080/api/v1';
  }
  return 'https://xchango-mid.onrender.com/api/v1';
}

export const API_URL = direccionMid();

const CLAVE_TOKEN = 'xchango_token';
const CLAVE_TOKEN_ADMIN = 'xchango_admin_token';

// el admin y el usuario normal tienen cada uno su token
function claveToken(admin: boolean): string {
  if (admin) {
    return CLAVE_TOKEN_ADMIN;
  }
  return CLAVE_TOKEN;
}

export function leerToken(admin = false): string | null {
  try {
    return localStorage.getItem(claveToken(admin));
  } catch {
    return null;
  }
}

export function guardarToken(token: string, admin = false): void {
  try {
    localStorage.setItem(claveToken(admin), token);
  } catch {
    // sin almacenamiento la sesion dura hasta recargar
  }
}

export function borrarToken(admin = false): void {
  try {
    localStorage.removeItem(claveToken(admin));
  } catch {
    // nada
  }
}

// saca el mensaje que manda el MID: { ok: false, mensaje: '...' }
export function mensajeDeError(e: any): string {
  if (e && e.error && e.error.mensaje) {
    return e.error.mensaje;
  }
  if (e && e.status === 0) {
    return 'No se pudo conectar con el servidor.';
  }
  return 'Ocurrió un error. Intenta de nuevo.';
}
