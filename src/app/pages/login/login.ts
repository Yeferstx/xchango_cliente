import { LogoXchangoComponent } from '../../components/logo-xchango/logo-xchango';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  signal
} from '@angular/core';

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MetodoAcceso, ModoAuth } from './metodo-acceso/metodo-acceso';

export interface Producto {
  imagen: string;
  nombre: string;
  ubicacion: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: true,
  imports: [LogoXchangoComponent, MetodoAcceso, RouterLink, FormsModule],
})
export class Login implements OnInit, OnDestroy {

  // productos destacados

  productos: Producto[] = [

    {
      imagen: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=220&fit=crop',
      nombre: 'Canon EOS 200D',
      ubicacion: 'Yopal'
    },

    {
      imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtPnCA_0TO68aqvqwfOV-sHfTd_Ejn832DODwDfBBQ5MTNboRLkpWWl3HU&s=10',
      nombre: 'Smartwatch',
      ubicacion: 'Mani'
    },

    {
      imagen: 'https://http2.mlstatic.com/D_NQ_NP_694714-CBT109951411899_042026-O.webp',
      nombre: 'Tenis deportivos',
      ubicacion: 'Yopal'
    },

    {
      imagen: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=220&fit=crop',
      nombre: 'Audífonos inalámbricos',
      ubicacion: 'Yopal'
    },

    {
      imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=220&fit=crop',
      nombre: 'MacBook Air M1',
      ubicacion: 'Monterrey'
    },

    {
      imagen: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=300&h=220&fit=crop',
      nombre: 'Bicicleta GW',
      ubicacion: 'Mani'
    },

    {
      imagen: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&h=220&fit=crop',
      nombre: 'PlayStation 5',
      ubicacion: 'Aguazul'
    },

    {
      imagen: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&h=220&fit=crop',
      nombre: 'Audífonos Sony',
      ubicacion: 'Yopal'
    },

    {
      imagen: 'https://silloneschile.cl/wp-content/uploads/2023/08/silloneschile.cl-sofa-de-cuero.webp',
      nombre: 'Sillon Clasico',
      ubicacion: 'Monterrey'
    },

    {
      imagen: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=220&fit=crop',
      nombre: 'Gafas de sol',
      ubicacion: 'Aguazul'
    },

    {
      imagen: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=220&fit=crop',
      nombre: 'Jean clásico',
      ubicacion: 'Villanueva'
    },

    {
      imagen: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=220&fit=crop',
      nombre: 'Chaqueta',
      ubicacion: 'Aguazul'
    },

    {
      imagen: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=220&fit=crop',
      nombre: 'Cámara digital',
      ubicacion: 'Yopal'
    },

    {
      imagen: 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?w=300&h=220&fit=crop',
      nombre: 'Laptop Lenovo',
      ubicacion: 'Monterrey'
    },

    {
      imagen: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=220&fit=crop',
      nombre: 'Camiseta deportiva',
      ubicacion: 'Yopal'
    }

  ];

  // configuracion

  private visibles = 4;

  private intervalo = 5000;

  // fundido corto para que no se vean las tarjetas en blanco
  private duracionFundido = 260;

  // timers

  private timerCarrusel?: ReturnType<typeof setInterval>;

  private timerFundido?: ReturnType<typeof setTimeout>;
  private timerReaparicion?: ReturnType<typeof setTimeout>;

  // estados carrusel

  inicio = signal(0);

  atenuado = signal(false);

  cambiando = signal(false);

  pausado = signal(false);

  // estado modal de autenticacion

  modalAbierto = signal(false);

  modoAuth = signal<ModoAuth>('login');

  // BUSCADOR Y REDES SOCIALES (sin sesion)

  terminoBusqueda = '';

  explorarComoInvitado(): void {
    this.router.navigate(['/home']);
  }

  // el buscador del hero tambien funciona sin haber iniciado sesion
  buscarComoInvitado(): void {
    const termino = this.terminoBusqueda.trim();
    this.router.navigate(['/home'], termino ? { queryParams: { buscar: termino } } : {});
  }

  // productos visibles

  productosVisibles = computed<Producto[]>(() => {

    const lista = this.productos;

    const posicion = this.inicio();

    const resultado: Producto[] = [];

    // siempre se muestran 4 productos, al llegar al final se vuelve al inicio

    for (let i = 0; i < this.visibles; i++) {

      resultado.push(
        lista[(posicion + i) % lista.length]
      );

    }

    return resultado;

  });

  // ciclo de vida

  ngOnInit(): void {

    this.iniciarCarrusel();

  }

  ngOnDestroy(): void {

    this.detenerCarrusel();

  }

  // pausar

  pausar(): void {

    this.pausado.set(true);

  }

  reanudar(): void {

    this.pausado.set(false);

  }

  // modal de autenticacion

  abrirModal(modo: ModoAuth): void {

    this.modoAuth.set(modo);
    this.modalAbierto.set(true);

  }

  cerrarModal(): void {

    this.modalAbierto.set(false);

  }

  cambiarModoAuth(modo: ModoAuth): void {

    this.modoAuth.set(modo);

  }

  private router = inject(Router);

  continuarConCorreo(): void {
    this.cerrarModal();

    if (this.modoAuth() === 'registro') {
      this.router.navigate(['/formulario']);
    } else {
      this.router.navigate(['/acceso']);
    }
  }

  // iniciar

  private iniciarCarrusel(): void {

    if (this.productos.length <= this.visibles) {
      return;
    }

    this.timerCarrusel = setInterval(() => {

      if (this.pausado() || this.cambiando()) {
        return;
      }

      this.avanzar();

    }, this.intervalo);

  }

  // flechas del carrusel

  siguienteProducto(): void {
    this.avanzar(1);
  }

  anteriorProducto(): void {
    this.avanzar(-1);
  }

  // avanzar (paso 1 va hacia adelante y -1 hacia atras)

  private avanzar(paso: number = 1): void {

    if (this.cambiando()) {
      return;
    }

    this.cambiando.set(true);

    // 1. se desaparecen

    this.atenuado.set(true);

    this.timerFundido = setTimeout(() => {

      // 2. se avanza un producto, al final vuelve al inicio

      this.inicio.update(valor => (valor + paso + this.productos.length) % this.productos.length);

      // 3. vuelven a aparecer

      this.timerReaparicion = setTimeout(() => {

        this.atenuado.set(false);

        this.cambiando.set(false);

      }, 20);

    }, this.duracionFundido);

  }

  // detener

  private detenerCarrusel(): void {

    if (this.timerCarrusel) {

      clearInterval(this.timerCarrusel);

      this.timerCarrusel = undefined;

    }

    if (this.timerFundido) {

      clearTimeout(this.timerFundido);

      this.timerFundido = undefined;

    }

    if (this.timerReaparicion) {

      clearTimeout(this.timerReaparicion);

      this.timerReaparicion = undefined;

    }

  }

}