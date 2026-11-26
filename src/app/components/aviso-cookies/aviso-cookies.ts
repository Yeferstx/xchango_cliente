import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';

const CLAVE_COOKIES = 'xchango_cookies';

// aviso de cookies que sale la primera vez que se entra a la pagina
@Component({
  selector: 'app-aviso-cookies',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './aviso-cookies.html',
  styleUrl: './aviso-cookies.css',
})
export class AvisoCookiesComponent {
  private router = inject(Router);

  private respondio = signal(this.yaRespondio());

  // pagina actual, para no tapar los terminos cuando los abren desde el aviso
  private url = signal(this.router.url);

  constructor() {
    this.router.events.subscribe((evento) => {
      if (evento instanceof NavigationEnd) {
        this.url.set(evento.urlAfterRedirects);
      }
    });
  }

  visible = computed(() => !this.respondio() && !this.url().startsWith('/legal-info'));

  aceptar(): void {
    this.guardar('aceptadas');
  }

  rechazar(): void {
    this.guardar('rechazadas');
  }

  private guardar(respuesta: string): void {
    try {
      localStorage.setItem(CLAVE_COOKIES, respuesta);
    } catch {
      // sin almacenamiento vuelve a salir al recargar
    }
    this.respondio.set(true);
  }

  private yaRespondio(): boolean {
    try {
      return localStorage.getItem(CLAVE_COOKIES) !== null;
    } catch {
      return false;
    }
  }
}
