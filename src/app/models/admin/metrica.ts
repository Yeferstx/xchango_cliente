// modelos de las metricas del panel

// totales actuales. Son coherentes con el resto de los JSON
export interface MetricasResumen {
  usuarios: number;
  usuariosActivos: number;
  publicaciones: number;
  intercambios: number;
  publicacionesReportadas: number;
  usuariosSuspendidos: number;
}

// alias historico; algunos componentes lo importaban con este nombre
export type Metrica = MetricasResumen;

// punto de una serie de grafica. 'valor' es una magnitud, nunca dinero
export interface SerieGrafico {
  label: string;
  valor: number;
}

export interface Comparativa {
  actual: number;
  anterior: number;
  porcentaje: number;
}

export interface MetricasData {
  resumen: MetricasResumen;
  comparativas: any;
  actividadMensual: SerieGrafico[];
  intercambiosPorMes: SerieGrafico[];
  publicacionesPorCategoria: SerieGrafico[];
  actividadPorUbicacion: SerieGrafico[];
  crecimientoCategorias: SerieGrafico[];
}
