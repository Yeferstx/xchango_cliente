// deja el celular en 10 digitos (le quita el +57 del inicio)
// devuelve null si no es un celular de Colombia (10 digitos que empiezan por 3)
export function limpiarCelular(texto: string): string | null {
  let numeros = texto.replace(/\D/g, '');

  if (numeros.length === 12 && numeros.startsWith('57')) {
    numeros = numeros.substring(2);
  }

  if (numeros.length !== 10 || !numeros.startsWith('3')) {
    return null;
  }

  return numeros;
}

export const MENSAJE_CELULAR = 'El celular debe tener 10 dígitos y empezar por 3. Ejemplo: 3001234567.';
