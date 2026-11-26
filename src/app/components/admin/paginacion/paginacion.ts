import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-paginacion',
  standalone: true,
  imports: [],
  templateUrl: './paginacion.html',
  styleUrl: './paginacion.css',
})
export class Paginacion {

  total = input<number>(0);
  porPagina = input<number>(10);
  pagina = input<number>(1);

  cambio = output<number>();
}