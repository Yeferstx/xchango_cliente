// aviso que sale en el selector de ubicacion segun el municipio
export interface AvisoUbicacion {
  id: string;
  // municipio al que corresponde. Vacio = mensaje por defecto
  municipio: string;
  titulo: string;
  mensaje: string;
  icono: string;
}
