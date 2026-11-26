import { LogoXchangoComponent } from '../../components/logo-xchango/logo-xchango';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthPinService } from '../../services/auth-pin';

// paso de verificacion por correo, reutilizado en /acceso y /formulario
// valida el PIN de 4 digitos que el MID mando al correo
@Component({
  selector: 'app-verificar-codigo',
  standalone: true,
  imports: [LogoXchangoComponent, FormsModule, CommonModule],
  templateUrl: './verificar-codigo.html',
  styleUrl: './verificar-codigo.css',
})
export class VerificarCodigoComponent {
  private auth = inject(AuthPinService);

  @Input() correo = '';

  @Output() verificado = new EventEmitter<void>();
  @Output() volver = new EventEmitter<void>();

  codigo = signal('');
  error = signal('');
  aviso = signal('');
  enviando = signal(false);

  segundos = this.auth.segundosParaReenviar;
  puedeReenviar = this.auth.puedeReenviar;

  cambioCodigo(valor: string): void {
    // solo numeros, maximo 4
    this.codigo.set(valor.replace(/\D/g, '').slice(0, 4));
    this.error.set('');
    this.aviso.set('');
  }

  async confirmar(): Promise<void> {
    const valor = this.codigo();

    if (valor.length < 4) {
      this.error.set('El PIN tiene 4 dígitos.');
      return;
    }

    this.enviando.set(true);
    const problema = await this.auth.verificarPin(this.correo, valor);
    this.enviando.set(false);

    if (problema) {
      this.error.set(problema);
      this.codigo.set('');
      return;
    }

    this.verificado.emit();
  }

  async reenviar(): Promise<void> {
    const problema = await this.auth.enviarPin(this.correo);

    if (problema) {
      this.error.set(problema);
      return;
    }

    this.codigo.set('');
    this.error.set('');
    this.aviso.set('Te enviamos un PIN nuevo.');
  }

  volverAtras(): void {
    this.volver.emit();
  }
}
