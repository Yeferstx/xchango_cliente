// achica una foto antes de mandarla al MID
// las fotos del celular pesan varios MB, aqui se bajan de tamaño
// y se devuelven como texto (base64 en JPG) para enviarlas
export function achicarImagen(archivo: File, ladoMaximo: number, calidad: number): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();

    lector.onerror = () => rechazar(new Error('No se pudo leer la imagen.'));

    lector.onload = () => {
      const imagen = new Image();

      imagen.onerror = () => rechazar(new Error('El archivo no es una imagen válida.'));

      imagen.onload = () => {
        // si la foto ya es pequeña no se agranda
        const escala = Math.min(1, ladoMaximo / Math.max(imagen.width, imagen.height));
        const ancho = Math.round(imagen.width * escala);
        const alto = Math.round(imagen.height * escala);

        const lienzo = document.createElement('canvas');
        lienzo.width = ancho;
        lienzo.height = alto;

        const contexto = lienzo.getContext('2d');
        if (!contexto) {
          rechazar(new Error('No se pudo procesar la imagen.'));
          return;
        }

        // fondo blanco para que los PNG con transparencia no queden negros
        contexto.fillStyle = '#ffffff';
        contexto.fillRect(0, 0, ancho, alto);
        contexto.drawImage(imagen, 0, 0, ancho, alto);

        resolver(lienzo.toDataURL('image/jpeg', calidad));
      };

      imagen.src = String(lector.result);
    };

    lector.readAsDataURL(archivo);
  });
}
