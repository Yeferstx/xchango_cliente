import { Component, input } from '@angular/core';

@Component({
  selector: 'app-badge-estado',
  standalone: true,
  imports: [],
  templateUrl: './badge-estado.html',
  styleUrl: './badge-estado.css',
})
export class BadgeEstado {
  estado = input<string>('');
  etiqueta = input<string>('');
  punto = input<boolean>(true);
}