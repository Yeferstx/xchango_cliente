import { LogoXchangoComponent } from '../../components/logo-xchango/logo-xchango';
import { Component, OnInit, inject } from '@angular/core';
import { IconoComponent } from '../../components/icono/icono';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TruequesService } from '../../services/trueques';
import { nombreCompleto } from '../../models/usuario.model';

@Component({
    selector: 'app-datos-cuenta',
    standalone: true,
    imports: [LogoXchangoComponent, IconoComponent, CommonModule, RouterLink],
    templateUrl: './datos_cuenta.html',
    styleUrl: './datos_cuenta.css'
})
export class DatosCuentaComponent implements OnInit {
    private servicio = inject(TruequesService);
    private router = inject(Router);

    // modal para confirmar que de verdad quiere eliminar la cuenta
    confirmando = false;
    errorEliminar = '';

    async ngOnInit(): Promise<void> {
        await this.servicio.esperarDatos();
        // por si el moderador ya verifico la cuenta
        await this.servicio.refrescar();
    }

    get usuario(): any {
        return this.servicio.usuarioActual();
    }

    get nombreUsuario(): string {
        if (this.usuario) {
            return nombreCompleto(this.usuario);
        }
        return 'Invitado';
    }

    get avatarUrl(): string {
        if (this.usuario && this.usuario.avatar) {
            return this.usuario.avatar;
        }
        return '/Logo-xchango/avatar-defecto.png';
    }

    get calificacion(): number {
        if (this.usuario && this.usuario.calificacion) {
            return Math.round(this.usuario.calificacion);
        }
        return 0;
    }

    get verificada(): boolean {
        if (this.usuario && this.usuario.verificacion === 'verificado') {
            return true;
        }
        return false;
    }

    // la fecha llega como aaaa-mm-dd y se muestra con el mes en letras
    get fechaRegistro(): string {
        if (!this.usuario || !this.usuario.fechaRegistro) {
            return '';
        }
        const fecha = this.usuario.fechaRegistro;
        return new Date(fecha.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }

    pedirEliminar(): void {
        this.errorEliminar = '';
        this.confirmando = true;
    }

    cerrarConfirmacion(): void {
        this.confirmando = false;
    }

    async confirmarEliminar(): Promise<void> {
        const error = await this.servicio.eliminarCuenta();
        if (error) {
            this.errorEliminar = error;
            return;
        }

        this.confirmando = false;
        this.router.navigate(['/']);
    }

}
