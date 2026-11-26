// reporte de una publicacion
export type EstadoReporte = 'pendiente' | 'aprobada' | 'eliminada';
export type GravedadReporte = 'baja' | 'media' | 'alta';

// forma cruda tal como esta en el JSON
export interface Reporte {
  id: string;
  publicacionId: string;
  // usuario que levanto el reporte
  reportanteId: string;
  motivo: string;
  fecha: string;
  estado: EstadoReporte;
  gravedad: GravedadReporte;
}

// reporte con los datos de la publicacion y del dueño ya unidos
export interface PublicacionReportada extends Reporte {
  titulo: string;
  usuarioId: string;
  usuarioNombre: string;
  categoria: string;
  tipo: string;
  reportanteNombre: string;
}
