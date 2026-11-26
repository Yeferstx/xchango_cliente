import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DocumentosService, MiDocumento } from '../../services/documentos';
import { TruequesService } from '../../services/trueques';
import { achicarImagen } from '../../shared/imagenes';

@Component({
  selector: 'app-verificar-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verificar-cuenta.html',
  styleUrl: './verificar-cuenta.css',
})
export class VerificarCuentaComponent implements OnInit {
  private documentos = inject(DocumentosService);
  private trueques = inject(TruequesService);
  private ruta = inject(ActivatedRoute);

  get destinoVolver(): string {
    const origen = this.ruta.snapshot.queryParamMap.get('desde');
    if (origen === 'cuenta') {
      return '/perfil/cuenta';
    }
    if (origen === 'notificaciones') {
      return '/notificaciones';
    }
    return '/perfil';
  }

  get textoVolver(): string {
    if (this.destinoVolver === '/perfil/cuenta') {
      return 'Volver a Datos de tu cuenta';
    }
    if (this.destinoVolver === '/notificaciones') {
      return 'Volver a Notificaciones';
    }
    return 'Volver al perfil';
  }

  tiposDocumento = this.documentos.tiposDocumento;

  misDocumentos: MiDocumento[] = [];
  cargando = true;

  tipoDocumento = '';
  numero = '';
  fotoFrente = '';
  fotoReverso = '';
  // viene del registro cuando el documento no se pudo enviar
  avisoRegistro = false;

  error = '';
  exito = '';
  enviando = false;

  async ngOnInit(): Promise<void> {
    this.avisoRegistro = this.ruta.snapshot.queryParamMap.get('aviso') === 'documento';
    await this.trueques.esperarDatos();
    // se vuelven a pedir los datos por si el moderador ya reviso el documento
    await this.trueques.refrescar();
    await this.cargarDocumentos();
  }

  // la cuenta queda verificada cuando el moderador aprueba el documento
  get verificada(): boolean {
    const usuario = this.trueques.usuarioActual();
    if (usuario && usuario.verificacion === 'verificado') {
      return true;
    }
    return false;
  }

  // mientras haya uno pendiente no se puede subir otro
  get hayPendiente(): boolean {
    for (const d of this.misDocumentos) {
      if (d.estado === 'pendiente') {
        return true;
      }
    }
    return false;
  }

  get puedeSubir(): boolean {
    return !this.verificada && !this.hayPendiente;
  }

  private async cargarDocumentos(): Promise<void> {
    try {
      this.misDocumentos = await this.documentos.obtenerMios();
    } catch {
      this.error = 'No se pudieron cargar tus documentos.';
    }
    this.cargando = false;
  }

  async fotoSeleccionada(event: Event, lado: string): Promise<void> {
    const input: any = event.target;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const archivo = input.files[0];

    if (archivo.type !== 'image/jpeg' && archivo.type !== 'image/png') {
      this.error = 'La foto debe ser JPG o PNG.';
      return;
    }

    try {
      // el documento se achica a 1600 px para que se lea bien y no pese tanto
      const texto = await achicarImagen(archivo, 1600, 0.8);
      if (lado === 'frente') {
        this.fotoFrente = texto;
      } else {
        this.fotoReverso = texto;
      }
      this.error = '';
    } catch {
      this.error = 'No se pudo leer esa foto. Prueba con otra.';
    }
  }

  async enviar(): Promise<void> {
    this.error = '';
    this.exito = '';

    if (!this.tipoDocumento) {
      this.error = 'Elige el tipo de documento.';
      return;
    }
    if (!this.numero.trim()) {
      this.error = 'Escribe el número del documento.';
      return;
    }
    if (!this.fotoFrente || !this.fotoReverso) {
      this.error = 'Adjunta la foto de tu documento por los dos lados.';
      return;
    }

    this.enviando = true;
    const mensaje = await this.documentos.subir(this.tipoDocumento, this.numero, this.fotoFrente, this.fotoReverso);
    this.enviando = false;

    if (mensaje) {
      this.error = mensaje;
      return;
    }

    this.exito = 'Listo, un moderador revisará tu documento.';
    this.tipoDocumento = '';
    this.numero = '';
    this.fotoFrente = '';
    this.fotoReverso = '';
    this.avisoRegistro = false;
    await this.cargarDocumentos();
  }

  textoEstado(estado: string): string {
    if (estado === 'aprobado') {
      return 'Aprobado';
    }
    if (estado === 'rechazado') {
      return 'Rechazado';
    }
    return 'En revisión';
  }
}
