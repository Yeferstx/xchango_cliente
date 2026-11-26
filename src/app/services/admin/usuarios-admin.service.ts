import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { API_URL } from '../../config/api';
import { UsuarioPlataforma } from '../../models/admin/usuario-plataforma';

// filtros de la tabla de usuarios, 'todos' o 'todas' es sin filtro
export interface FiltroUsuarios {
  busqueda?: string;
  estado?: string;
  nivel?: string;
  ubicacion?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosAdminService {
  private http = inject(HttpClient);

  private listaUsuarios = signal<UsuarioPlataforma[]>([]);
  private estaCargando = signal(false);
  private mensajeError = signal('');
  private cargado = false;

  usuarios = this.listaUsuarios.asReadonly();
  cargando = this.estaCargando.asReadonly();
  error = this.mensajeError.asReadonly();

  total = computed(() => this.listaUsuarios().length);

  suspendidos = computed(() => {
    let total = 0;
    for (const u of this.listaUsuarios()) {
      if (u.estado === 'suspendido') {
        total = total + 1;
      }
    }
    return total;
  });

  // carga una sola vez, se llama desde el ngOnInit del componente
  cargar(): void {
    if (this.cargado) {
      return;
    }
    this.cargado = true;
    this.estaCargando.set(true);
    this.mensajeError.set('');

    this.http.get(API_URL + '/admin/usuarios').subscribe({
      next: (datos: any) => {
        this.listaUsuarios.set(datos);
        this.estaCargando.set(false);
      },
      error: () => {
        // se deja volver a intentar
        this.cargado = false;
        this.mensajeError.set('No se pudieron cargar los usuarios.');
        this.estaCargando.set(false);
      },
    });
  }

  private recargar(): void {
    this.cargado = false;
    this.cargar();
  }

  // consultas

  // buscador y filtros juntos
  filtrar(f: FiltroUsuarios): UsuarioPlataforma[] {
    let texto = '';
    if (f.busqueda) {
      texto = f.busqueda.trim().toLowerCase();
    }

    const lista: UsuarioPlataforma[] = [];

    for (const u of this.listaUsuarios()) {
      let pasa = true;

      if (texto && !u.nombre.toLowerCase().includes(texto) && !u.email.toLowerCase().includes(texto)) {
        pasa = false;
      }
      if (f.estado && f.estado !== 'todos' && u.estado !== f.estado) {
        pasa = false;
      }
      if (f.nivel && f.nivel !== 'todos' && u.nivelActividad !== f.nivel) {
        pasa = false;
      }
      if (f.ubicacion && f.ubicacion !== 'todas' && u.ubicacion !== f.ubicacion) {
        pasa = false;
      }

      if (pasa) {
        lista.push(u);
      }
    }

    return lista;
  }

  // saca de la lista solo los de la pagina pedida
  paginar(lista: any[], pagina: number, porPagina: number): any[] {
    const inicio = (pagina - 1) * porPagina;
    return lista.slice(inicio, inicio + porPagina);
  }

  obtener(id: string): UsuarioPlataforma | undefined {
    return this.listaUsuarios().find((u) => u.id === id);
  }

  // ubicaciones sin repetir para el select
  ubicaciones(): string[] {
    const lista: string[] = [];
    for (const u of this.listaUsuarios()) {
      if (!lista.includes(u.ubicacion)) {
        lista.push(u.ubicacion);
      }
    }
    return lista.sort();
  }

  // puntos de cada usuario para el ranking de actividad
  private puntosActividad(u: UsuarioPlataforma): number {
    let peso = 1;
    if (u.nivelActividad === 'alto') {
      peso = 3;
    } else if (u.nivelActividad === 'medio') {
      peso = 2;
    }
    return peso * (u.publicaciones + u.intercambios);
  }

  // rankings de la seccion 8 / HU76
  ranking(criterio: string, limite = 5): UsuarioPlataforma[] {
    const lista = this.listaUsuarios().slice();

    if (criterio === 'actividad') {
      lista.sort((a, b) => this.puntosActividad(b) - this.puntosActividad(a));
    } else if (criterio === 'publicaciones') {
      lista.sort((a, b) => b.publicaciones - a.publicaciones);
    } else {
      lista.sort((a, b) => b.intercambios - a.intercambios);
    }

    return lista.slice(0, limite);
  }

  // cambios, se ven de una vez y se mandan al MID

  suspender(id: string): void {
    this.cambiarEstado(id, 'suspendido');
  }

  activar(id: string): void {
    this.cambiarEstado(id, 'activo');
  }

  advertir(id: string): void {
    this.cambiarEstado(id, 'advertido');
  }

  editar(id: string, cambios: any): void {
    const nuevaLista: UsuarioPlataforma[] = [];
    for (const u of this.listaUsuarios()) {
      if (u.id === id) {
        nuevaLista.push(Object.assign({}, u, cambios));
      } else {
        nuevaLista.push(u);
      }
    }
    this.listaUsuarios.set(nuevaLista);

    this.http.put(API_URL + '/admin/usuarios/' + id, cambios).subscribe({
      error: () => this.recargar(),
    });
  }

  private cambiarEstado(id: string, estado: UsuarioPlataforma['estado']): void {
    const nuevaLista: UsuarioPlataforma[] = [];
    for (const u of this.listaUsuarios()) {
      const copia = Object.assign({}, u);
      if (u.id === id) {
        copia.estado = estado;
      }
      nuevaLista.push(copia);
    }
    this.listaUsuarios.set(nuevaLista);

    this.http.patch(API_URL + '/admin/usuarios/' + id + '/estado', { estado: estado }).subscribe({
      error: () => this.recargar(),
    });
  }
}
