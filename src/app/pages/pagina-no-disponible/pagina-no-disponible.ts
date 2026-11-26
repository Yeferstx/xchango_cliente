import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-pagina-no-disponible',
  imports: [RouterLink],
  template: '<main class="pagina"><h1>{{ titulo }}</h1><p>{{ mensaje }}</p><a class="enlace-volver" [routerLink]="destino">{{ accion }}</a></main>',
  styles: '.pagina { max-width: 38rem; margin: 12vh auto; padding: 1.5rem; } .pagina a { text-decoration: underline; }',
})
// pagina para rutas que no existen o que todavia no estan hechas
// el texto se pone en app.routes.ts, si no se pone sale el de no encontrada
export class PaginaNoDisponible {
  private datos = inject(ActivatedRoute).snapshot.data;
  titulo = this.datos['titulo'] || 'Página no encontrada';
  mensaje = this.datos['mensaje'] || 'Revisa la dirección o explora las publicaciones de XchanGo.';
  destino = this.datos['destino'] || '/home';
  accion = this.datos['accion'] || 'Ir a Inicio';
}
