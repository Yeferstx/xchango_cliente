import { LogoXchangoComponent } from '../../components/logo-xchango/logo-xchango';
import { Component, OnInit, inject } from '@angular/core';
import { IconoComponent } from '../../components/icono/icono';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TruequesService } from '../../services/trueques';
import { achicarImagen } from '../../shared/imagenes';
import { nombreCompleto } from '../../models/usuario.model';
import { limpiarCelular, MENSAJE_CELULAR } from '../../shared/celular';

@Component({
    selector: 'app-informacion',
    standalone: true,
    imports: [LogoXchangoComponent, IconoComponent, CommonModule, FormsModule, RouterLink],
    templateUrl: './informacion.html',
    styleUrl: './informacion.css'
})
export class InformacionComponent implements OnInit {
    private servicio = inject(TruequesService);

    calificacionMaxima: number = 5;
    totalCalificacionesRequeridas: number = 5;

    // campos del formulario
    nombreElegido: string = '';
    apellidoElegido: string = '';
    numeroTelefono: string = '';
    direccion: string = '';
    barrio: string = '';
    descripcion: string = '';
    errorGuardado: string = '';

    // foto nueva escogida (se ve antes de guardar)
    fotoVistaPrevia: string | null = null;
    private fotoAchicada: string | null = null;

    guardado = false;

    async ngOnInit(): Promise<void> {
        await this.servicio.esperarDatos();
        const usuario = this.servicio.usuarioActual();
        if (!usuario) {
            return;
        }

        this.nombreElegido = usuario.nombre;
        this.apellidoElegido = usuario.apellido;

        // si el numero quedo guardado con el 57 se muestra solo con los 10 digitos
        this.numeroTelefono = '';
        if (usuario.telefono) {
            this.numeroTelefono = usuario.telefono;
            const celular = limpiarCelular(usuario.telefono);
            if (celular) {
                this.numeroTelefono = celular;
            }
        }

        if (usuario.direccion) {
            this.direccion = usuario.direccion;
        }
        if (usuario.barrio) {
            this.barrio = usuario.barrio;
        }
        if (usuario.descripcion) {
            this.descripcion = usuario.descripcion;
        }
    }

    // datos del perfil (el mismo lado izquierdo que en /perfil)
    get nombreUsuario(): string {
        const usuario = this.servicio.usuarioActual();
        if (usuario) {
            return nombreCompleto(usuario);
        }
        return 'Invitado';
    }

    get avatarUrl(): string {
        if (this.fotoVistaPrevia) {
            return this.fotoVistaPrevia;
        }
        const usuario = this.servicio.usuarioActual();
        if (usuario && usuario.avatar) {
            return usuario.avatar;
        }
        return '/Logo-xchango/avatar-defecto.png';
    }

    get calificacion(): number {
        const usuario = this.servicio.usuarioActual();
        if (usuario && usuario.calificacion) {
            return usuario.calificacion;
        }
        return 0;
    }

    get notificaciones(): number {
        return this.servicio.notificacionesSinLeer();
    }

    // true es estrella llena y false vacia
    estrellas(): boolean[] {
        const lista: boolean[] = [];
        for (let i = 0; i < this.calificacionMaxima; i++) {
            lista.push(i < Math.round(this.calificacion));
        }
        return lista;
    }

    async archivoSeleccionado(event: Event): Promise<void> {
        const input: any = event.target;
        if (!input.files || input.files.length === 0) {
            return;
        }
        const archivo = input.files[0];

        try {
            // la foto se achica para que no pese varios MB
            this.fotoAchicada = await achicarImagen(archivo, 256, 0.8);
            this.fotoVistaPrevia = this.fotoAchicada;
            this.errorGuardado = '';
        } catch {
            this.errorGuardado = 'No se pudo leer esa foto. Prueba con una JPG o PNG.';
        }
    }

    async guardarCambios(): Promise<void> {
        this.errorGuardado = '';
        this.guardado = false;

        if (!this.nombreElegido.trim() || !this.apellidoElegido.trim()) {
            this.errorGuardado = 'El nombre y el apellido no pueden estar vacíos.';
            return;
        }

        const celular = limpiarCelular(this.numeroTelefono);
        if (!celular) {
            this.errorGuardado = MENSAJE_CELULAR;
            return;
        }

        if (this.descripcion.trim().length > 300) {
            this.errorGuardado = 'La descripción no puede pasar de 300 caracteres.';
            return;
        }

        const cambios: any = {
            nombre: this.nombreElegido.trim(),
            apellido: this.apellidoElegido.trim(),
            telefono: celular,
            direccion: this.direccion.trim(),
            barrio: this.barrio.trim(),
            descripcion: this.descripcion.trim(),
        };
        if (this.fotoAchicada) {
            cambios.avatar = this.fotoAchicada;
        }

        const mensaje = await this.servicio.actualizarPerfil(cambios);

        if (mensaje) {
            this.errorGuardado = mensaje;
            return;
        }

        this.guardado = true;
        setTimeout(() => {
            this.guardado = false;
        }, 2500);
    }
}
