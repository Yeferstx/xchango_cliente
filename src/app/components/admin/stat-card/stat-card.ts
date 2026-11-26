import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [Icon],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css',
})
export class StatCard {
  etiqueta = input<string>('');
  valor = input<string | number>(0);
  icono = input<string>('');
  variacion = input<number | null>(null);
  detalle = input<string>('');
  tono = input<string>('');

  esNegativa(): boolean {
    const v = this.variacion();
    if (v !== null && v < 0) {
      return true;
    }
    return false;
  }

  // a los numeros positivos se les pone el +
  signo(): string {
    const v = this.variacion();
    if (v !== null && v > 0) {
      return '+';
    }
    return '';
  }
}