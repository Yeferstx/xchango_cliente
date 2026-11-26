import { Component, input } from '@angular/core';

@Component({
  selector: 'app-chart-barras',
  standalone: true,
  imports: [],
  templateUrl: './chart-barras.html',
  styleUrl: './chart-barras.css',
})
export class ChartBarras {
  datos = input<any[]>([]);
  color = input<string>('');
  modoCrecimiento = input<boolean>(false);

  // el valor mas alto, para saber que tan larga va cada barra
  maximo(): number {
    let mayor = 1;
    for (const d of this.datos()) {
      if (Math.abs(d.valor) > mayor) {
        mayor = Math.abs(d.valor);
      }
    }
    return mayor;
  }

  magnitud(valor: number): number {
    return Math.abs(valor);
  }
}