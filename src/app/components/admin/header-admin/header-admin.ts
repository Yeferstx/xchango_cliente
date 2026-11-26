import { Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-header-admin',
  standalone: true,
  imports: [Icon],
  templateUrl: './header-admin.html',
  styleUrl: './header-admin.css',
})
export class HeaderAdmin {

  titulo = input<string>('');
  subtitulo = input<string>('');

  abrirMenu = output<void>();
  salir = output<void>();
}