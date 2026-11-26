import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SidebarAdmin } from '../../../components/admin/sidebar-admin/sidebar-admin';
import { HeaderAdmin } from '../../../components/admin/header-admin/header-admin';
import { AdminsAdminService } from '../../../services/admin/admins-admin.service';
import { UsuariosAdminService } from '../../../services/admin/usuarios-admin.service';
import { PublicacionesAdminService } from '../../../services/admin/publicaciones-admin.service';
import { MetricasAdminService } from '../../../services/admin/metricas-admin.service';
import { AlertasAdminService } from '../../../services/admin/alertas-admin.service';
import { HistorialAdminService } from '../../../services/admin/historial-admin.service';

// titulo y bajada del header segun la ruta activa
const TITULOS: any = {
  dashboard: { titulo: 'Dashboard', sub: 'Resumen general de la plataforma' },
  reportes: { titulo: 'Reportes y estadísticas', sub: 'Métricas, gráficos y exportación de datos' },
  administracion: { titulo: 'Administración', sub: 'Estado y actividad del sistema' },
  usuarios: { titulo: 'Gestión de usuarios', sub: 'Administra las cuentas de la plataforma' },
  moderacion: { titulo: 'Moderación de contenido', sub: 'Revisa publicaciones reportadas' },
  documentos: { titulo: 'Verificación de documentos', sub: '' },
  'crear-usuario': { titulo: 'Crear usuario', sub: 'Cuenta de moderación o administración' },
  ranking: { titulo: 'Ranking y métricas', sub: 'Usuarios, categorías y ubicaciones destacadas' },
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarAdmin, HeaderAdmin],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout implements OnInit {
  private router = inject(Router);
  private auth = inject(AdminsAdminService);
  private usuarios = inject(UsuariosAdminService);
  private publicaciones = inject(PublicacionesAdminService);
  private metricas = inject(MetricasAdminService);
  private alertas = inject(AlertasAdminService);
  private historial = inject(HistorialAdminService);

  // menu lateral en pantallas pequeñas
  menuAbierto = signal(false);

  // ultima parte de la url, ej: /admin/usuarios -> usuarios
  private seccion = signal('dashboard');

  titulo = computed(() => {
    const datos = TITULOS[this.seccion()];
    if (datos) {
      return datos.titulo;
    }
    return 'Panel administrativo';
  });

  subtitulo = computed(() => {
    const datos = TITULOS[this.seccion()];
    if (datos) {
      return datos.sub;
    }
    return '';
  });

  constructor() {
    this.cambiarSeccion(this.router.url);

    // cada vez que cambia de pagina se actualiza el titulo
    this.router.events.subscribe((evento) => {
      if (evento instanceof NavigationEnd) {
        this.cambiarSeccion(evento.urlAfterRedirects);
      }
    });
  }

  private cambiarSeccion(url: string): void {
    const partes = url.split('?')[0].split('/');
    let ultima = partes[partes.length - 1];
    if (!ultima) {
      ultima = 'dashboard';
    }
    this.seccion.set(ultima);
  }

  ngOnInit(): void {
    // los servicios solo cargan una vez, llamar cargar() otra vez no repite la peticion
    this.usuarios.cargar();
    this.publicaciones.cargar();
    this.metricas.cargar();
    this.alertas.cargar();
    this.historial.cargar();
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}
