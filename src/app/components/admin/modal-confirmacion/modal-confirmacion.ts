import { Component, input, output, signal } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-modal-confirmacion',
  standalone: true,
  imports: [Icon],
  templateUrl: './modal-confirmacion.html',
  styleUrl: './modal-confirmacion.css',
})
export class ModalConfirmacion {
  abierto = input<boolean>(false);
  titulo = input<string>('');
  mensaje = input<string>('');
  textoConfirmar = input<string>('Confirmar');
  icono = input<string>('alert');
  tono = input<string>('warn');
  pideMotivo = input<boolean>(false);
  etiquetaMotivo = input<string>('Motivo');

  confirmar = output<string>();
  cancelar = output<void>();
  motivo = signal('');
}