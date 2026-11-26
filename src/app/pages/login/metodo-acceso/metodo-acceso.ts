import { LogoXchangoComponent } from '../../../components/logo-xchango/logo-xchango';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output
} from '@angular/core';

export type ModoAuth = 'login' | 'registro';

@Component({
  imports: [LogoXchangoComponent],
  selector: 'app-metodo-acceso',
  templateUrl: './metodo-acceso.html',
  styleUrl: './metodo-acceso.css',
  standalone: true,
})
export class MetodoAcceso {

  // entradas

  @Input() abierto = false;

  @Input() modo: ModoAuth = 'login';

  // salidas

  @Output() cerrar = new EventEmitter<void>();

  @Output() cambiarModo = new EventEmitter<ModoAuth>();

  @Output() seleccionarMetodo = new EventEmitter<void>();

  // textos segun modo

  get titulo(): string {

    return this.modo === 'registro'
      ? 'Crear una cuenta'
      : 'Iniciar sesión';

  }

  get subtitulo(): string {

    return this.modo === 'registro'
      ? 'Elige cómo quieres crear tu cuenta'
      : 'Elige cómo quieres continuar';

  }

  get textoCambioModo(): string {

    return this.modo === 'registro'
      ? '¿Ya tienes una cuenta?'
      : '¿No tienes una cuenta?';

  }

  get accionCambioModo(): string {

    return this.modo === 'registro'
      ? 'Iniciar sesión'
      : 'Crear cuenta';

  }

  // acciones

  cerrarModal(): void {

    this.cerrar.emit();

  }

  clicFondo(event: MouseEvent): void {

    // solo cierra si el clic fue exactamente sobre el overlay,
    // no si vino de un elemento hijo (el propio modal)
    if (event.target === event.currentTarget) {

      this.cerrarModal();

    }

  }

  alternarModo(): void {

    if (this.modo === 'registro') {
      this.cambiarModo.emit('login');
    } else {
      this.cambiarModo.emit('registro');
    }

  }

  elegirCorreo(): void {

    this.seleccionarMetodo.emit();

  }

  @HostListener('document:keydown.escape')
  teclaEscape(): void {

    if (this.abierto) {

      this.cerrarModal();

    }

  }

}