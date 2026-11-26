import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type TamanoLogo = 'sm' | 'md' | 'lg';

// logo de xchango, son dos imagenes: el chango y las letras
// se usa asi: <app-logo-xchango tamano="lg" enlace="/home"></app-logo-xchango>
@Component({
  selector: 'app-logo-xchango',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './logo-xchango.html',
  styleUrl: './logo-xchango.css',
})
export class LogoXchangoComponent {
  @Input() tamano: TamanoLogo = 'md';

  // ruta a la que lleva el logo. Si va vacia no es un enlace
  @Input() enlace = '';

  // solo el chango, para espacios angostos
  @Input() soloChango = false;

  @Input() compactoEnMovil = false;

  // usa logo.png, que ya trae el chango con las letras debajo
  // es el que va dentro de las ventanas de entrar y crear cuenta
  @Input() apilado = false;
}
