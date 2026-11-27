import { Component, input, output } from '@angular/core';

// botones de anterior y siguiente para las tablas del panel
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

  // cuantas paginas salen con el total de registros
  totalPaginas(): number {
    const paginas = Math.ceil(this.total() / this.porPagina());
    if (paginas < 1) {
      return 1;
    }
    return paginas;
  }

  // numero del primer y ultimo registro que se esta viendo
  desde(): number {
    if (this.total() === 0) {
      return 0;
    }
    return (this.pagina() - 1) * this.porPagina() + 1;
  }

  hasta(): number {
    const ultimo = this.pagina() * this.porPagina();
    if (ultimo > this.total()) {
      return this.total();
    }
    return ultimo;
  }

  anterior(): void {
    if (this.pagina() > 1) {
      this.cambio.emit(this.pagina() - 1);
    }
  }

  siguiente(): void {
    if (this.pagina() < this.totalPaginas()) {
      this.cambio.emit(this.pagina() + 1);
    }
  }
}
