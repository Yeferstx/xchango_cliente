import { LogoXchangoComponent } from '../../components/logo-xchango/logo-xchango';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Icon } from '../../components/admin/icon/icon';
import { AdminsAdminService } from '../../services/admin/admins-admin.service';

@Component({
  selector: 'app-login-administracion',
  standalone: true,
  imports: [LogoXchangoComponent, FormsModule, Icon, RouterLink],
  templateUrl: './login-administracion.html',
  styleUrl: './login-administracion.css',
})
export class LoginAdministracion {
  private auth = inject(AdminsAdminService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  verPassword = signal(false);
  cargando = signal(false);
  error = signal('');

  async enviar(): Promise<void> {
    if (this.cargando()) {
      return;
    }
    this.error.set('');

    if (!this.email().trim() || !this.password()) {
      this.error.set('Ingresa tu correo y contraseña.');
      return;
    }

    this.cargando.set(true);
    try {
      await this.auth.login(this.email(), this.password());
      // si queria entrar a una pagina del panel se manda alla, si no al dashboard
      let destino = this.route.snapshot.queryParamMap.get('redirigir');
      if (!destino || !destino.startsWith('/admin/') || destino.startsWith('/admin/login')) {
        destino = '/admin/dashboard';
      }
      await this.router.navigateByUrl(destino, { replaceUrl: true });
    } catch (e) {
      if (e instanceof Error) {
        this.error.set(e.message);
      } else {
        this.error.set('No se pudo iniciar sesión.');
      }
      this.password.set('');
    } finally {
      this.cargando.set(false);
    }
  }
}
