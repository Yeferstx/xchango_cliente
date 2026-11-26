import { LogoXchangoComponent } from '../../components/logo-xchango/logo-xchango';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { IconoComponent } from '../../components/icono/icono';
import { MUNICIPIOS_CASANARE } from '../../shared/municipios-casanare';
import { TruequesService } from '../../services/trueques';
import { nombreCompleto } from '../../models/usuario.model';

// ubicacion de la cuenta: el municipio y el barrio donde la persona hace
// sus trueques. Se guardan en el MID con el perfil
@Component({
    selector: 'app-ubicacion',
    standalone: true,
    imports: [LogoXchangoComponent, IconoComponent, CommonModule, FormsModule, RouterLink],
    templateUrl: './ubicacion.html',
    styleUrl: './ubicacion.css'
})
export class UbicacionComponent implements OnInit {

    private servicio = inject(TruequesService);

    municipios: string[] = MUNICIPIOS_CASANARE;

    // ubicacion guardada
    municipio = signal('');
    barrio = signal('');

    // datos del formulario mientras se edita
    editando = signal(false);
    tempMunicipio = signal('');
    tempBarrio = signal('');

    errorUbicacion = signal('');
    guardandoUbicacion = signal(false);

    get nombreUsuario(): string {
        const usuario = this.servicio.usuarioActual();
        if (usuario) {
            return nombreCompleto(usuario);
        }
        return 'Invitado';
    }

    get avatarUrl(): string {
        const usuario = this.servicio.usuarioActual();
        if (usuario && usuario.avatar) {
            return usuario.avatar;
        }
        return '/Logo-xchango/avatar-defecto.png';
    }

    get calificacion(): number {
        const usuario = this.servicio.usuarioActual();
        if (usuario && usuario.calificacion) {
            return Math.round(usuario.calificacion);
        }
        return 0;
    }

    async ngOnInit(): Promise<void> {
        await this.servicio.esperarDatos();
        this.municipio.set('Yopal');
        this.barrio.set('');

        const usuario = this.servicio.usuarioActual();
        if (usuario && usuario.ubicacion) {
            this.municipio.set(usuario.ubicacion);
        }
        if (usuario && usuario.barrio) {
            this.barrio.set(usuario.barrio);
        }
    }

    iniciarEdicion(): void {
        this.tempMunicipio.set(this.municipio());
        this.tempBarrio.set(this.barrio());
        this.errorUbicacion.set('');
        this.editando.set(true);
    }

    cancelarEdicion(): void {
        this.editando.set(false);
    }

    async guardarUbicacion(): Promise<void> {
        if (!this.tempMunicipio()) {
            this.errorUbicacion.set('Elige un municipio.');
            return;
        }

        this.errorUbicacion.set('');
        this.guardandoUbicacion.set(true);

        const error = await this.servicio.actualizarPerfil({
            ubicacion: this.tempMunicipio(),
            barrio: this.tempBarrio().trim(),
        });

        this.guardandoUbicacion.set(false);

        if (error) {
            this.errorUbicacion.set(error);
            return;
        }

        this.municipio.set(this.tempMunicipio());
        this.barrio.set(this.tempBarrio().trim());
        this.editando.set(false);
    }

}
