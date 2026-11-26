import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AvisoCookiesComponent } from './components/aviso-cookies/aviso-cookies';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AvisoCookiesComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = signal('xchango');
}
