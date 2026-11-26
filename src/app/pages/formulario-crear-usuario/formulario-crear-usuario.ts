import { LegalInfo } from '../legal-info/legal-info';
import { LogoXchangoComponent } from '../../components/logo-xchango/logo-xchango';
import { limpiarCelular, MENSAJE_CELULAR } from '../../shared/celular';
import { DocumentosService } from '../../services/documentos';
import { Component } from "@angular/core";
import { inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { TruequesService } from "../../services/trueques";
import { AuthPinService } from "../../services/auth-pin";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { VerificarCodigoComponent } from "../../layout/verificar-codigo/verificar-codigo";
import { MUNICIPIOS_CASANARE } from "../../shared/municipios-casanare";
import { achicarImagen } from "../../shared/imagenes";

interface RegistroUsuario {
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  direccion: string;
  ciudad: string;
  barrio: string;
  email: string;
  telefono: string;
}

@Component({
  selector: "formulario-crear-usuario",
  standalone: true,
  imports: [LegalInfo, LogoXchangoComponent, CommonModule, FormsModule, VerificarCodigoComponent, RouterLink],
  templateUrl: "./formulario-crear-usuario.html",
  styleUrls: ["./formulario-crear-usuario.css"],
})
export class formulario_crear_usuarioComponent {
  seccionLegal = signal<'terminos' | 'privacidad' | null>(null);

  volverAlCorreo(): void {
    this.paso.set('correo');
    this.enfocar('correo-inicial');
  }

  volverDelLegal(): void {
    const seccion = this.seccionLegal();
    this.seccionLegal.set(null);
    this.enfocar('registro-' + seccion);
  }

  // pone el cursor en un campo cuando ya se ve en pantalla
  private enfocar(id: string): void {
    setTimeout(() => {
      const campo = document.getElementById(id);
      if (campo) {
        campo.focus();
      }
    });
  }

  modelo: RegistroUsuario = {
    nombres: "",
    apellidos: "",
    fechaNacimiento: "",
    direccion: "",
    ciudad: "Yopal",
    barrio: "",
    email: "",
    telefono: "+57 ",
  };

  municipios = MUNICIPIOS_CASANARE;

  // la fecha mas reciente que se puede elegir: hoy hace 18 años (aaaa-mm-dd)
  fechaMaxima = (() => {
    const fecha = new Date();
    fecha.setFullYear(fecha.getFullYear() - 18);
    return fecha.toISOString().slice(0, 10);
  })();

  // paso actual del registro: primero el correo, luego el codigo, luego el formulario
  paso = signal<'correo' | 'verificar' | 'formulario'>('correo');

  errorRegistro = "";
  // para que el boton de continuar no se presione dos veces
  enviandoCorreo = false;

  private servicio = inject(TruequesService);

  private auth = inject(AuthPinService);

  private router = inject(Router);

  private documentos = inject(DocumentosService);

  // documento de identidad (es opcional, pero si se sube va completo)
  tiposDocumento = this.documentos.tiposDocumento;
  tipoDocumento = "";
  numeroDocumento = "";
  docFrente = "";
  docReverso = "";

  // la foto ya achicada y convertida a texto, lista para mandar
  fotoPerfilTexto = "";
  fotoPerfilNombre = "";
  arrastrandoFoto = false;

  private tiposPermitidos = ["image/png", "image/jpeg"];
  private tamanoMaximoBytes = 5 * 1024 * 1024; // 5MB

  fotoPerfilSeleccionada(event: Event): void {
    const input: any = event.target;
    if (!input.files || input.files.length === 0) {
      return;
    }
    this.asignarFotoPerfil(input.files[0]);
  }

  arrastrarEncima(event: DragEvent): void {
    event.preventDefault();
    this.arrastrandoFoto = true;
  }

  salirArrastre(event: DragEvent): void {
    event.preventDefault();
    this.arrastrandoFoto = false;
  }

  soltarArchivo(event: DragEvent): void {
    event.preventDefault();
    this.arrastrandoFoto = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.asignarFotoPerfil(event.dataTransfer.files[0]);
    }
  }

  private async asignarFotoPerfil(archivo: File): Promise<void> {
    if (!this.tiposPermitidos.includes(archivo.type)) {
      this.errorRegistro = "La foto debe ser JPG o PNG.";
      return;
    }
    if (archivo.size > this.tamanoMaximoBytes) {
      this.errorRegistro = "La foto supera el máximo de 5MB.";
      return;
    }

    try {
      this.fotoPerfilTexto = await achicarImagen(archivo, 256, 0.8);
      this.fotoPerfilNombre = archivo.name;
      this.errorRegistro = "";
    } catch {
      this.errorRegistro = "No se pudo leer esa foto. Prueba con otra.";
    }
  }

  // foto del documento: lado "frente" o "reverso". Se achica a 1600 px para que se lea
  async documentoSeleccionado(event: Event, lado: string): Promise<void> {
    const input: any = event.target;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const archivo = input.files[0];

    if (!this.tiposPermitidos.includes(archivo.type)) {
      this.errorRegistro = "La foto del documento debe ser JPG o PNG.";
      return;
    }
    if (archivo.size > this.tamanoMaximoBytes) {
      this.errorRegistro = "La foto del documento supera el máximo de 5MB.";
      return;
    }

    try {
      const texto = await achicarImagen(archivo, 1600, 0.8);
      if (lado === "frente") {
        this.docFrente = texto;
      } else {
        this.docReverso = texto;
      }
      this.errorRegistro = "";
    } catch {
      this.errorRegistro = "No se pudo leer esa foto. Prueba con otra.";
    }
  }

  // true si la persona lleno algo del documento
  get quiereSubirDocumento(): boolean {
    return !!(this.tipoDocumento || this.numeroDocumento.trim() || this.docFrente || this.docReverso);
  }

  quitarFotoPerfil(): void {
    this.fotoPerfilTexto = "";
    this.fotoPerfilNombre = "";
  }

  // paso 1: solo el correo. Se manda el PIN y, si ya tiene cuenta, se avisa
  async continuarConCorreo(): Promise<void> {
    if (this.enviandoCorreo) {
      return;
    }
    this.errorRegistro = "";
    const correo = this.modelo.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      this.errorRegistro = "Ingresa un correo válido.";
      return;
    }

    this.enviandoCorreo = true;
    const problema = await this.auth.enviarPin(correo, 'registro');
    this.enviandoCorreo = false;
    if (problema) {
      this.errorRegistro = problema;
      return;
    }

    if (!this.auth.requiereRegistro()) {
      this.errorRegistro = "Ese correo ya tiene una cuenta. Inicia sesión en vez de registrarte.";
      return;
    }

    this.modelo.email = correo;
    this.paso.set('verificar');
  }

  // paso 2: PIN verificado, ahora si se llena el resto de los datos
  codigoVerificado(): void {
    this.paso.set('formulario');
  }

  // paso 3: formulario completo, ya se registra de verdad
  async enviarFormulario(): Promise<void> {
    this.errorRegistro = "";

    const nombre = this.modelo.nombres.trim();
    const apellido = this.modelo.apellidos.trim();
    const direccion = this.modelo.direccion.trim();
    const barrio = this.modelo.barrio.trim();

    if (!nombre) {
      this.errorRegistro = "Escribe tu nombre.";
      return;
    }
    if (!apellido) {
      this.errorRegistro = "Escribe tu apellido.";
      return;
    }
    if (!this.modelo.fechaNacimiento) {
      this.errorRegistro = "Elige tu fecha de nacimiento.";
      return;
    }
    if (this.modelo.fechaNacimiento > this.fechaMaxima) {
      this.errorRegistro = "Debes ser mayor de 18 años para registrarte.";
      return;
    }
    if (!direccion) {
      this.errorRegistro = "Escribe tu dirección.";
      return;
    }
    if (!barrio) {
      this.errorRegistro = "Escribe tu barrio.";
      return;
    }

    if (
      this.quiereSubirDocumento &&
      !(this.tipoDocumento && this.numeroDocumento.trim() && this.docFrente && this.docReverso)
    ) {
      this.errorRegistro =
        "Para enviar tu documento completa el tipo, el número y las fotos de los dos lados (o déjalo vacío).";
      return;
    }

    const celular = limpiarCelular(this.modelo.telefono);
    if (!celular) {
      this.errorRegistro = MENSAJE_CELULAR;
      return;
    }

    const mensaje = await this.servicio.registrar({
      nombre: nombre,
      apellido: apellido,
      fechaNacimiento: this.modelo.fechaNacimiento,
      email: this.modelo.email,
      telefono: celular,
      ubicacion: this.modelo.ciudad || "Yopal",
      direccion: direccion,
      barrio: barrio,
      avatar: this.fotoPerfilTexto,
    });

    if (mensaje) {
      this.errorRegistro = mensaje;
      return;
    }

    // ya quedo registrado y con la sesion abierta. Si puso el documento, se manda ahora
    if (this.quiereSubirDocumento) {
      const problema = await this.documentos.subir(
        this.tipoDocumento,
        this.numeroDocumento,
        this.docFrente,
        this.docReverso,
      );

      if (problema) {
        // la cuenta ya existe; se lleva a la pantalla donde puede volver a intentarlo
        this.router.navigate(["/perfil/verificacion"], { queryParams: { aviso: "documento" } });
        return;
      }
    }

    this.router.navigate(["/home"]);
  }
}
