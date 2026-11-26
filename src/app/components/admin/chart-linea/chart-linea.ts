import { Component, input } from '@angular/core';

@Component({
  selector: 'app-chart-linea',
  standalone: true,
  imports: [],
  templateUrl: './chart-linea.html',
  styleUrl: './chart-linea.css',
})
export class ChartLinea {

  datos = input<any[]>([]);
  color = input<string>('#a1785a');

  // el valor mas alto, para saber que tan alta va la linea
  maximo(): number {
    let mayor = 1;
    for (const d of this.datos()) {
      if (d.valor > mayor) {
        mayor = d.valor;
      }
    }
    return mayor;
  }

}