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

    if (this.modo === 'registro') {

      return 'Crear una cuenta';

    }

    return 'Iniciar sesión';

  }

  get subtitulo(): string {

    if (this.modo === 'registro') {

      return 'Elige cómo quieres crear tu cuenta';

    }

    return 'Elige cómo quieres continuar';

  }

  get textoCambioModo(): string {

    if (this.modo === 'registro') {

      return '¿Ya tienes una cuenta?';

    }

    return '¿No tienes una cuenta?';

  }

  get accionCambioModo(): string {

    if (this.modo === 'registro') {

      return 'Iniciar sesión';

    }

    return 'Crear cuenta';

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