import { LogoXchangoComponent } from '../../components/logo-xchango/logo-xchango';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TruequesService } from '../../services/trueques';
import { AuthPinService } from '../../services/auth-pin';
import { VerificarCodigoComponent } from '../../layout/verificar-codigo/verificar-codigo';

// inicio de sesion solo con correo (sin contraseña). El MID manda un PIN
// al correo y con ese PIN se entra
@Component({
  selector: 'app-acceso',
  standalone: true,
  imports: [LogoXchangoComponent, CommonModule, FormsModule, RouterLink, VerificarCodigoComponent],
  templateUrl: './acceso.html',
  styleUrl: './acceso.css',
})
export class AccesoComponent implements OnInit {
  volverAlCorreo(): void {
    this.mostrarVerificacion.set(false);
    setTimeout(() => {
      const campo = document.getElementById('ac-email');
      if (campo) {
        campo.focus();
      }
    });
  }

  private servicio = inject(TruequesService);
  private auth = inject(AuthPinService);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);

  email = '';
  error = signal('');

  mostrarVerificacion = signal(false);

  // a donde volver despues de entrar (lo pone el guard)
  private volverA = '/home';

  ngOnInit(): void {
    this.servicio.cargar();
    const destino = this.ruta.snapshot.queryParamMap.get('volverA');
    // solo se aceptan rutas de la misma pagina, que empiecen con una sola /
    if (destino && destino.startsWith('/') && !destino.startsWith('//')) {
      this.volverA = destino;
    }
  }

  async entrar(): Promise<void> {
    this.error.set('');

    if (!this.email.trim()) {
      this.error.set('Completa tu correo.');
      return;
    }

    const problema = await this.auth.enviarPin(this.email, 'entrar');
    if (problema) {
      this.error.set(problema);
      return;
    }

    this.mostrarVerificacion.set(true);
  }

  async codigoVerificado(): Promise<void> {
    if (this.auth.requiereRegistro()) {
      this.auth.limpiarVerificacion();
      this.mostrarVerificacion.set(false);
      this.error.set('Ese correo todavía no tiene cuenta. Regístrate primero.');
      return;
    }

    const mensaje = await this.servicio.iniciarSesion();
    if (mensaje) {
      this.mostrarVerificacion.set(false);
      this.error.set(mensaje);
      return;
    }

    this.router.navigateByUrl(this.volverA, { replaceUrl: true });
  }
}
