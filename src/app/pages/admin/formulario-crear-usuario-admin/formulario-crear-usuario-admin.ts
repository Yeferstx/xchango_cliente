import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { IconoComponent } from '../../../components/icono/icono';
import { AdminsAdminService } from '../../../services/admin/admins-admin.service';

interface RolUsuario {
  id: 'administrador' | 'moderador';
  titulo: string;
  descripcion: string;
  icono: string;
  colorClase: string;
}

// crear moderadores, solo entra el admin (soloAdminGuard)
@Component({
  selector: 'app-formulario-crear-usuario-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconoComponent],
  templateUrl: './formulario-crear-usuario-admin.html',
  styleUrls: ['./formulario-crear-usuario-admin.css'],
})
export class FormularioCrearUsuarioAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private adminsSrv = inject(AdminsAdminService);

  // tarjetas de rol que se pueden elegir
  roles: RolUsuario[] = [
    {
      id: 'moderador',
      titulo: 'Moderador',
      descripcion:
        'Revisa y gestiona publicaciones, reportes y usuarios. No puede crear otros usuarios ni entrar a la configuración del sistema.',
      icono: 'verified_user',
      colorClase: 'icono-verde',
    },
    {
      id: 'administrador',
      titulo: 'Administrador',
      descripcion:
        'Acceso total: gestiona usuarios, moderadores, reportes y todos los módulos de la plataforma.',
      icono: 'shield',
      colorClase: 'icono-accent',
    },
  ];

  form: FormGroup = new FormGroup({});
  mostrarContrasena = false;
  mostrarConfirmarContrasena = false;
  mensajeError = '';

  maxNotas = 200;
  fechaCreacion = new Date();

  ngOnInit(): void {
    this.adminsSrv.cargar();

    this.form = this.fb.group({
      nombreCompleto: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: [''],
      nombreUsuario: ['', Validators.required],
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
      confirmarContrasena: ['', Validators.required],
      rol: ['moderador', Validators.required],
      estado: ['activo', Validators.required],
      notas: ['', Validators.maxLength(this.maxNotas)],
    });
  }

  // ayudas para la plantilla

  seleccionarRol(id: string): void {
    this.form.patchValue({ rol: id });
  }

  get rolSeleccionado(): RolUsuario | undefined {
    for (const r of this.roles) {
      if (r.id === this.form.value.rol) {
        return r;
      }
    }
    return undefined;
  }

  seleccionarEstado(estado: string): void {
    this.form.patchValue({ estado: estado });
  }

  get fechaCreacionFormateada(): string {
    const dia = String(this.fechaCreacion.getDate()).padStart(2, '0');
    const mes = String(this.fechaCreacion.getMonth() + 1).padStart(2, '0');
    const anio = this.fechaCreacion.getFullYear();
    return dia + '/' + mes + '/' + anio;
  }

  // si el campo esta vacio se muestra un ejemplo en la vista previa
  get nombreCompletoVistaPrevia(): string {
    if (this.form.value.nombreCompleto) {
      return this.form.value.nombreCompleto;
    }
    return 'Juan Pérez Gómez';
  }

  get correoVistaPrevia(): string {
    if (this.form.value.correo) {
      return this.form.value.correo;
    }
    return 'juan@correo.com';
  }

  get usuarioVistaPrevia(): string {
    if (this.form.value.nombreUsuario) {
      return this.form.value.nombreUsuario;
    }
    return 'juanperez';
  }

  verContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  verConfirmarContrasena(): void {
    this.mostrarConfirmarContrasena = !this.mostrarConfirmarContrasena;
  }

  // revisa que la confirmacion sea igual a la contraseña
  get contrasenasNoCoinciden(): boolean {
    const contrasena = this.form.value.contrasena;
    const confirmar = this.form.value.confirmarContrasena;
    if (confirmar && contrasena !== confirmar) {
      return true;
    }
    return false;
  }

  // navegacion y guardado

  cancelar(): void {
    this.router.navigate(['/admin/administracion']);
  }

  volver(): void {
    this.router.navigate(['/admin/administracion']);
  }

  async enviarFormulario(): Promise<void> {
    this.mensajeError = '';

    if (this.form.invalid || this.contrasenasNoCoinciden) {
      this.form.markAllAsTouched();
      this.mensajeError = 'Revisa los campos marcados antes de continuar.';
      return;
    }

    const v = this.form.getRawValue();

    // en el formulario se llama administrador pero el MID usa admin
    let rol: 'admin' | 'moderador' = 'moderador';
    if (v.rol === 'administrador') {
      rol = 'admin';
    }
    let estado: 'activo' | 'inactivo' = 'inactivo';
    if (v.estado === 'activo') {
      estado = 'activo';
    }

    const error = await this.adminsSrv.crearUsuarioInterno({
      nombre: v.nombreCompleto,
      email: v.correo,
      password: v.contrasena,
      rol: rol,
      estado: estado,
    });

    if (error) {
      this.mensajeError = error;
      return;
    }

    this.router.navigate(['/admin/administracion']);
  }
}
