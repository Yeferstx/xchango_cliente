import { LogoXchangoComponent } from '../../components/logo-xchango/logo-xchango';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { IconoComponent } from '../../components/icono/icono';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TruequesService } from '../../services/trueques';
import { nombreCompleto } from '../../models/usuario.model';
import { PublicacionVista } from '../../models/publicacion.model';

@Component({
    selector: 'app-mis-publicaciones',
    standalone: true,
    imports: [LogoXchangoComponent, IconoComponent, CommonModule, RouterLink],
    templateUrl: './mis_publicaciones.html',
    styleUrl: './mis_publicaciones.css'
})
export class MisPublicacionesComponent implements OnInit {

    filtro = signal('todas');

    filtros = [
        { id: 'todas', etiqueta: 'Todas' },
        { id: 'activa', etiqueta: 'Activas' },
        { id: 'pausada', etiqueta: 'Pausadas' },
        { id: 'finalizada', etiqueta: 'Finalizadas' }
    ] as const;

    private srv = inject(TruequesService);

    // mismos datos que en /perfil, para la tarjeta de la izquierda
    get nombreUsuario(): string {
        const usuario = this.srv.usuarioActual();
        if (usuario) {
            return nombreCompleto(usuario);
        }
        return 'Invitado';
    }

    get avatarUrl(): string {
        const usuario = this.srv.usuarioActual();
        if (usuario && usuario.avatar) {
            return usuario.avatar;
        }
        return '/Logo-xchango/avatar-defecto.png';
    }

    get calificacion(): number {
        const usuario = this.srv.usuarioActual();
        if (usuario && usuario.calificacion) {
            return usuario.calificacion;
        }
        return 0;
    }

    calificacionMaxima = 5;
    totalCalificacionesRequeridas = 5;

    get totalCalificaciones(): number {
        const usuario = this.srv.usuarioActual();
        if (usuario && usuario.totalCalificaciones) {
            return usuario.totalCalificaciones;
        }
        return 0;
    }

    get muestraCalificacion(): boolean {
        return this.totalCalificaciones >= this.totalCalificacionesRequeridas;
    }

    estrellas(): boolean[] {
        return Array.from(
            { length: this.calificacionMaxima },
            (_, i) => i < Math.round(this.calificacion),
        );
    }

    get notificaciones(): number {
        return this.srv.notificacionesSinLeer();
    }

    // mensaje que se muestra al tocar un boton que todavia no guarda
    aviso = '';

    // publicaciones reales del usuario en sesion
    publicaciones = this.srv.misPublicaciones;

    publicacionesFiltradas = computed<PublicacionVista[]>(() => {
        const f = this.filtro();
        return f === 'todas'
            ? this.publicaciones()
            : this.publicaciones().filter(p => p.estado === f);
    });

    totalActivas = computed(() => this.publicaciones().filter(p => p.estado === 'activa').length);
    totalPropuestas = computed(() => this.publicaciones().reduce((suma, p) => suma + p.propuestas, 0));
    totalVistas = computed(() => this.publicaciones().reduce((suma, p) => suma + p.vistas, 0));

    ngOnInit(): void {
        this.srv.cargar();
    }


    cambiarFiltro(id: string): void {
        this.filtro.set(id);
    }

    contarPor(estado: string): number {
        if (estado === 'todas') {
            return this.publicaciones().length;
        }
        return this.publicaciones().filter(p => p.estado === estado).length;
    }

    etiquetaEstado(estado: string): string {
        if (estado === 'activa') {
            return 'Activa';
        }
        if (estado === 'pausada') {
            return 'Pausada';
        }
        if (estado === 'finalizada') {
            return 'Finalizada';
        }
        return estado;
    }

    alternarPausa(id: string): void {
        this.srv.alternarEstadoPublicacion(id);
    }

    eliminar(id: string): void {
        if (confirm('¿Eliminar esta publicación? Dejará de estar visible para los demás.')) {
            this.srv.eliminarPublicacion(id);
        }
    }

    // total de solicitudes de trueque recibidas por mis publicaciones
    propuestasRecibidas = computed(() =>
        this.publicaciones().reduce((s, p) => s + p.propuestas, 0)
    );

}