import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { IconoComponent } from '../../components/icono/icono';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { inject } from '@angular/core';
import { DatosPublicacion, TruequesService } from '../../services/trueques';
import { TipoPublicacion } from '../../models/publicacion.model';
import { Categoria } from '../../models/categoria.model';
import { MUNICIPIOS_CASANARE } from '../../shared/municipios-casanare';
import { achicarImagen } from '../../shared/imagenes';

interface TipoIntercambio {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;      // nombre de material icon
  colorClase: string; // clase css para el color del icono/tarjeta
}

@Component({
  selector: 'app-formulario-editar-trueque',
  standalone: true,
  imports: [IconoComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './formulario-editar-trueque.html',
  styleUrls: ['./formulario-editar-trueque.css']
})
export class FormularioEditarTruequeComponent implements OnInit {

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

  opcionesDisponibilidad: string[] = [
    'Inmediata',
    'Fines de semana',
    'Entre semana',
    'Horario flexible',
    'Por acordar'
  ];

  // departamento fijo, la plataforma solo funciona en Casanare
  departamento = 'Casanare';
  municipiosCasanare: string[] = MUNICIPIOS_CASANARE;

  // estado del formulario
  form: FormGroup;

  // id del trueque que se esta editando (viene de la ruta)
  truequeId: string | null = null;
  cargandoTrueque = false;
  errorCarga = '';
  // mensaje cuando falta un campo o el MID rechaza los cambios
  errorGuardado = '';
  // si la publicacion estaba activa al abrir el formulario
  estadoOriginal = true;

  // imagenes que ya tenia la publicacion
  imagenesExistentes: string[] = [];

  // imagenes nuevas que se escogen al editar
  imagenesNuevas: File[] = [];
  imagenesNuevasVistaPrevia: string[] = [];

  indiceImagenVistaPrevia = 0;
  maxImagenes = 5;
  maxDescripcion = 500;
  arrastrandoArchivo = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
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

  private srv = inject(TruequesService);

  // las categorias vienen de la base de datos
  categorias(): Categoria[] {
    return this.srv.categorias();
  }

  ngOnInit(): void {
    this.srv.cargar();

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

    // toma el id de la ruta, ej: /trueque/:id/editar
    this.truequeId = this.route.snapshot.paramMap.get('id');

    if (this.truequeId) {
      this.cargarTrueque(this.truequeId);
    }
  }

  // busca la publicacion y llena el formulario con sus datos
  private async cargarTrueque(id: string): Promise<void> {
    this.cargandoTrueque = true;
    this.errorCarga = '';

    await this.srv.esperarDatos();

    const p = this.srv.obtenerPorId(id);
    if (!p) {
      this.errorCarga = 'No se encontró la publicación.';
      this.cargandoTrueque = false;
      this.cdr.markForCheck();
      return;
    }

    this.form.patchValue({
      tipoIntercambio: 'fisico',
      nombre: p.titulo,
      categoria: p.categoriaId,
      descripcion: p.descripcion,
      ofreces: p.ofreces,
      buscas: p.buscas,
      estado: p.estado === 'activa',
      disponibilidad: '',
      cantidad: '',
      municipio: '',
      barrio: '',
    });

    // estos campos solo existen en algunos tipos
    if (p.tipo === 'servicio') {
      this.form.patchValue({
        tipoIntercambio: 'servicio',
        disponibilidad: p.disponibilidad,
        cantidad: p.cantidadDisponible,
        municipio: p.municipio,
      });
    } else if (p.tipo === 'bien_digital') {
      this.form.patchValue({ tipoIntercambio: 'digital' });
    } else {
      this.form.patchValue({
        disponibilidad: p.disponibilidad,
        cantidad: p.cantidadDisponible,
        municipio: p.municipio,
        barrio: p.barrio,
      });
    }

    this.estadoOriginal = p.estado === 'activa';
    this.ajustarCampos();
    this.imagenesExistentes = p.imagenes.slice();
    this.cargandoTrueque = false;
    this.cdr.markForCheck();
  }

  // funciones que usa el html
  seleccionarTipo(id: string): void {
    this.form.patchValue({ tipoIntercambio: id });
    this.ajustarCampos();
  }

  // segun el tipo se piden unos campos u otros:
  //  - bien fisico: municipio, barrio, cantidad y disponibilidad
  //  - servicio: municipio, cantidad y disponibilidad (sin barrio)
  //  - bien digital: nada de ubicacion, cantidad ni disponibilidad
  private ajustarCampos(): void {
    const tipo = this.tipoReal();
    this.cambiarObligatorio('municipio', tipo !== 'bien_digital');
    this.cambiarObligatorio('disponibilidad', tipo !== 'bien_digital');
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
  camposConProblema(): string[] {
    const lista: string[] = [];
    for (const clave of Object.keys(this.etiquetas)) {
      const campo = this.form.get(clave);
      if (campo && campo.invalid) {
        lista.push(this.etiquetas[clave]);
      }
    }
    return lista;
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
    const titulos: string[] = [];
    for (const t of this.tiposIntercambio) {
      titulos.push(t.titulo);
    }
    return titulos.join(' | ');
  }

  // todas las imagenes de la vista previa, las que tenia y las nuevas
  get imagenesVistaPrevia(): string[] {
    return this.imagenesExistentes.concat(this.imagenesNuevasVistaPrevia);
  }

  get totalImagenes(): number {
    return this.imagenesExistentes.length + this.imagenesNuevas.length;
  }

  // imagenes (arrastrar y soltar o escoger archivo)
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
    const disponibles = this.maxImagenes - this.totalImagenes;
    this.errorGuardado = '';

    const archivos = Array.from(files).slice(0, disponibles);
    for (const file of archivos) {
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
        this.imagenesNuevas.push(file);
        this.imagenesNuevasVistaPrevia.push(texto);
        this.cdr.detectChanges();
      } catch {
        this.errorGuardado = 'No se pudo leer una de las fotos.';
      }
    }
  }

  // si la imagen ya estaba guardada se anota para borrarla en el servidor
  eliminarImagen(index: number): void {
    if (index < this.imagenesExistentes.length) {
      this.imagenesExistentes.splice(index, 1);
    } else {
      const indiceNueva = index - this.imagenesExistentes.length;
      this.imagenesNuevas.splice(indiceNueva, 1);
      this.imagenesNuevasVistaPrevia.splice(indiceNueva, 1);
    }

    if (this.indiceImagenVistaPrevia >= this.totalImagenes) {
      this.indiceImagenVistaPrevia = this.totalImagenes - 1;
      if (this.indiceImagenVistaPrevia < 0) {
        this.indiceImagenVistaPrevia = 0;
      }
    }
  }

  imagenAnterior(): void {
    const total = this.imagenesVistaPrevia.length;
    this.indiceImagenVistaPrevia = (this.indiceImagenVistaPrevia - 1 + total) % total;
  }

  imagenSiguiente(): void {
    const total = this.imagenesVistaPrevia.length;
    this.indiceImagenVistaPrevia = (this.indiceImagenVistaPrevia + 1) % total;
  }

  // volver y guardar
  get destinoVolver(): string {
    const origen = this.route.snapshot.queryParamMap.get('desde');
    if (origen === 'mis-publicaciones') {
      return '/mis-publicaciones';
    }
    return '/home';
  }

  volver(): void {
    this.router.navigate([this.destinoVolver]);
  }

  async enviarFormulario(): Promise<void> {
    this.errorGuardado = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorGuardado = 'Revisa estos campos: ' +
        this.camposConProblema().join(', ') + '.';
      return;
    }

    const v = this.form.getRawValue();
    const tipo = this.tipoReal();

    // si no escribio que ofrece se usa el nombre
    let ofreces = v.ofreces;
    if (!ofreces) {
      ofreces = v.nombre;
    }

    const datos: DatosPublicacion = {
      tipo: tipo,
      categoriaId: v.categoria,
      titulo: v.nombre,
      descripcion: v.descripcion,
      ofreces: ofreces,
      buscas: v.buscas,
      imagenes: this.imagenesVistaPrevia,
    };

    if (tipo !== 'bien_digital') {
      datos.municipio = v.municipio;
      datos.cantidadDisponible = v.cantidad;
      datos.disponibilidad = v.disponibilidad;
      if (tipo === 'bien_fisico') {
        datos.barrio = v.barrio;
      }
    }

    if (!this.truequeId) {
      this.errorGuardado = 'No se pudo guardar. ¿La publicación es tuya?';
      return;
    }

    const problema = await this.srv.actualizarPublicacion(this.truequeId, datos);
    if (problema) {
      this.errorGuardado = problema;
      return;
    }

    // si cambio el interruptor de estado se pausa o se activa
    if (v.estado !== this.estadoOriginal) {
      await this.srv.alternarEstadoPublicacion(this.truequeId);
    }

    this.router.navigate(['/trueque', this.truequeId], { queryParamsHandling: 'preserve' });
  }
}