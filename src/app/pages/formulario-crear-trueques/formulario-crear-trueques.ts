import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { IconoComponent } from '../../components/icono/icono';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DEPARTAMENTO, MUNICIPIOS_CASANARE } from '../../shared/municipios-casanare';
import { Categoria } from '../../models/categoria.model';
import { DatosPublicacion, TruequesService } from '../../services/trueques';
import { TipoPublicacion } from '../../models/publicacion.model';
import { achicarImagen } from '../../shared/imagenes';

interface TipoIntercambio {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;      // nombre de material icon
  colorClase: string; // clase css para el color del icono/tarjeta
}

@Component({
  selector: 'app-formulario-crear-trueques',
  standalone: true,
  imports: [IconoComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './formulario-crear-trueques.html',
  styleUrls: ['./formulario-crear-trueques.css']
})
export class formulario_crear_truequesComponent implements OnInit {

  // tipos de intercambio (tarjetas seleccionables)
  tiposIntercambio: TipoIntercambio[] = [
    {
      id: 'fisico',
      titulo: 'Bien físico',
      descripcion: 'Ofrece productos tangibles como ropa, libros, electrónicos y más.',
      icono: 'inventory_2',
      colorClase: 'icono-azul'
    },
    {
      id: 'servicio',
      titulo: 'Servicio',
      descripcion: 'Ofrece tus habilidades o servicios que otros puedan necesitar.',
      icono: 'handshake',
      colorClase: 'icono-verde'
    },
    {
      id: 'digital',
      titulo: 'Bien digital',
      descripcion: 'Ofrece productos digitales como archivos, cursos, plantillas y más.',
      icono: 'computer',
      colorClase: 'icono-morado'
    }
  ];

  // catalogos usados en los selects
  // catalogo unico. Referencia estable: es un signal del servicio
  get categorias(): Categoria[] {
    return this.truequesService.categorias();
  }

  opcionesDisponibilidad: string[] = [
    'Inmediata',
    'Fines de semana',
    'Entre semana',
    'Horario flexible',
    'Por acordar'
  ];

  // departamento fijo: la plataforma solo opera en Casanare
  errorGuardado = '';
  departamento = DEPARTAMENTO;
  municipiosCasanare: string[] = MUNICIPIOS_CASANARE;

  // estado del formulario
  form: FormGroup;

  imagenes: File[] = [];
  imagenesVistaPrevia: string[] = [];
  indiceImagenVistaPrevia = 0;
  maxImagenes = 5;
  maxDescripcion = 500;
  arrastrandoArchivo = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private truequesService: TruequesService
  ) {
    this.form = this.fb.group({});
    this.asegurarFuenteMaterialIcons();
  }

  // carga la fuente de Material Icons si no esta, si no los iconos salen como texto
  private asegurarFuenteMaterialIcons(): void {
    const idLink = 'material-icons-font';
    if (document.getElementById(idLink)) {
      return;
    }
    const link = document.createElement('link');
    link.id = idLink;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    document.head.appendChild(link);
  }

  ngOnInit(): void {
    this.truequesService.cargar();

    this.form = this.fb.group({
      tipoIntercambio: ['fisico', Validators.required],
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      categoria: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(this.maxDescripcion)]],
      ofreces: ['', Validators.maxLength(200)],
      buscas: ['', [Validators.required, Validators.maxLength(200)]],
      disponibilidad: [''],
      cantidad: ['', Validators.maxLength(40)],
      estado: [true],
      municipio: [''],
      barrio: ['', Validators.maxLength(80)]
    });

    this.ajustarCampos();
  }

  // segun el tipo se piden unos campos u otros:
  //  - bien fisico: municipio, barrio, cantidad y disponibilidad
  //  - servicio: municipio, cantidad y disponibilidad (sin barrio)
  //  - bien digital: nada de ubicacion, cantidad ni disponibilidad
  private ajustarCampos(): void {
    const tipo = this.tipoReal();
    const llevaUbicacion = tipo !== 'bien_digital';

    this.cambiarObligatorio('municipio', llevaUbicacion);
    this.cambiarObligatorio('disponibilidad', llevaUbicacion);
    this.cambiarObligatorio('barrio', tipo === 'bien_fisico');
  }

  // pone o quita el "obligatorio" de un campo, sin perder su largo maximo
  private cambiarObligatorio(nombre: string, obligatorio: boolean): void {
    const campo = this.form.get(nombre);
    if (!campo) {
      return;
    }
    const validadores = [];
    if (obligatorio) {
      validadores.push(Validators.required);
    }
    if (nombre === 'barrio') {
      validadores.push(Validators.maxLength(80));
    }
    campo.setValidators(validadores);
    campo.updateValueAndValidity();
  }

  get llevaUbicacion(): boolean {
    return this.tipoReal() !== 'bien_digital';
  }

  get llevaBarrio(): boolean {
    return this.tipoReal() === 'bien_fisico';
  }

  // como se llama cada campo en pantalla, para avisar cual esta mal
  private etiquetas: any = {
    nombre: 'Nombre del intercambio',
    categoria: 'Categoría',
    descripcion: 'Descripción',
    ofreces: 'Qué ofreces',
    buscas: 'Qué buscas a cambio',
    disponibilidad: 'Disponibilidad',
    cantidad: 'Cantidad disponible',
    municipio: 'Municipio',
    barrio: 'Barrio',
  };

  // los nombres de los campos que faltan o estan mal
  get camposConProblema(): string[] {
    const lista: string[] = [];
    for (const clave of Object.keys(this.etiquetas)) {
      const campo = this.form.get(clave);
      if (campo && campo.invalid) {
        lista.push(this.etiquetas[clave]);
      }
    }
    return lista;
  }

  // funciones que usa el html
  seleccionarTipo(id: string): void {
    this.form.patchValue({ tipoIntercambio: id });
    this.ajustarCampos();
  }

  get tipoSeleccionado(): TipoIntercambio | undefined {
    for (const t of this.tiposIntercambio) {
      if (t.id === this.form.value.tipoIntercambio) {
        return t;
      }
    }
    return undefined;
  }

  get tituloVistaPrevia(): string {
    return this.tiposIntercambio.map(t => t.titulo).join(' | ');
  }

  get descripcionRestante(): number {
    let valor = this.form.value.descripcion;
    if (!valor) {
      valor = '';
    }
    return this.maxDescripcion - valor.length;
  }

  // manejo de imagenes (drag & drop + input)
  arrastrarEncima(event: DragEvent): void {
    event.preventDefault();
    this.arrastrandoArchivo = true;
  }

  salirArrastre(event: DragEvent): void {
    event.preventDefault();
    this.arrastrandoArchivo = false;
  }

  soltarArchivo(event: DragEvent): void {
    event.preventDefault();
    this.arrastrandoArchivo = false;
    if (event.dataTransfer && event.dataTransfer.files) {
      this.agregarImagenes(event.dataTransfer.files);
    }
  }

  escogerArchivos(event: Event): void {
    const input: any = event.target;
    if (input.files) {
      this.agregarImagenes(input.files);
    }
    input.value = '';
  }

  private async agregarImagenes(files: FileList): Promise<void> {
    const disponibles = this.maxImagenes - this.imagenes.length;
    this.errorGuardado = '';

    for (const file of Array.from(files).slice(0, disponibles)) {
      if (!file.type.match(/image\/(jpeg|png)/)) {
        this.errorGuardado = 'Las fotos deben ser JPG o PNG.';
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.errorGuardado = 'Cada foto puede pesar máximo 5MB.';
        continue;
      }

      try {
        // la foto se achica a 1024 px para que no pese tanto al enviarla
        const texto = await achicarImagen(file, 1024, 0.8);

        this.imagenes.push(file);
        this.imagenesVistaPrevia.push(texto);
        this.cdr.detectChanges();
      } catch {
        this.errorGuardado = 'No se pudo leer una de las fotos.';
      }
    }
  }

  eliminarImagen(index: number): void {
    this.imagenes = this.imagenes.filter((_, i) => i !== index);
    this.imagenesVistaPrevia = this.imagenesVistaPrevia.filter((_, i) => i !== index);

    if (this.indiceImagenVistaPrevia >= this.imagenesVistaPrevia.length) {
      this.indiceImagenVistaPrevia = Math.max(0, this.imagenesVistaPrevia.length - 1);
    }
  }

  imagenAnterior(): void {
    this.indiceImagenVistaPrevia =
      (this.indiceImagenVistaPrevia - 1 + this.imagenesVistaPrevia.length) % this.imagenesVistaPrevia.length;
  }

  imagenSiguiente(): void {
    this.indiceImagenVistaPrevia =
      (this.indiceImagenVistaPrevia + 1) % this.imagenesVistaPrevia.length;
  }

  // navegacion / envio
  volver(): void {
    this.router.navigate(['/home']);
  }

  // convierte el id del selector visual al tipo que usa el modelo
  private tipoReal(): TipoPublicacion {
    const id = this.form.value.tipoIntercambio;
    if (id === 'servicio') {
      return 'servicio';
    }
    if (id === 'digital') {
      return 'bien_digital';
    }
    return 'bien_fisico';
  }

  async enviarFormulario(): Promise<void> {
    this.errorGuardado = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorGuardado = 'Revisa estos campos: ' +
        this.camposConProblema.join(', ') + '.';
      return;
    }

    const v = this.form.getRawValue();
    const tipo = this.tipoReal();

    // los campos se mandan segun el tipo: el bien digital no lleva ubicacion,
    // ni cantidad, ni disponibilidad, y el servicio no lleva barrio
    const datos: DatosPublicacion = {
      tipo: tipo,
      categoriaId: v.categoria,
      titulo: v.nombre,
      descripcion: v.descripcion,
      ofreces: v.ofreces || v.nombre,
      buscas: v.buscas,
      imagenes: this.imagenesVistaPrevia,
      estado: 'pausada',
    };

    // el interruptor dice si sale activa o pausada
    if (v.estado) {
      datos.estado = 'activa';
    }

    if (tipo !== 'bien_digital') {
      datos.municipio = v.municipio;
      datos.cantidadDisponible = v.cantidad;
      datos.disponibilidad = v.disponibilidad;
      if (tipo === 'bien_fisico') {
        datos.barrio = v.barrio;
      }
    }

    const resultado = await this.truequesService.crearPublicacion(datos);
    if ('error' in resultado) {
      this.errorGuardado = resultado.error;
      return;
    }

    this.router.navigate(['/trueque', resultado.id]);
  }
}