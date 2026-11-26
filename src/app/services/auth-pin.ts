import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_URL, borrarToken, guardarToken, mensajeDeError } from '../config/api';

// segundos que hay que esperar para pedir otro PIN
const ESPERA_REENVIO = 30;

// para entrar y registrarse se usa correo + PIN
// el PIN lo genera el MID y lo manda al correo, aca solo se pide y se verifica
@Injectable({ providedIn: 'root' })
export class AuthPinService {
  private http = inject(HttpClient);

  // true si el correo todavia no tiene cuenta (lo dice el MID)
  requiereRegistro = signal(false);

  segundosParaReenviar = signal(0);

  puedeReenviar = computed(() => this.segundosParaReenviar() === 0);

  private cuentaRegresiva: any = null;

  esCorreoValido(correo: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
  }

  // devuelve null si salio bien, o el mensaje de error
  async enviarPin(correo: string, modo: string = ''): Promise<string | null> {
    const limpio = correo.trim().toLowerCase();

    if (!this.esCorreoValido(limpio)) {
      return 'Escribe un correo válido.';
    }

    if (!this.puedeReenviar()) {
      return 'Espera ' + this.segundosParaReenviar() + ' segundos para pedir otro PIN.';
    }

    try {
      const respuesta: any = await firstValueFrom(
        this.http.post(API_URL + '/auth/pin', { correo: limpio, modo: modo }),
      );
      this.requiereRegistro.set(respuesta.requiereRegistro);
      this.arrancarEspera();
      return null;
    } catch (e) {
      return mensajeDeError(e);
    }
  }

  // devuelve null si el PIN estaba bien, o el mensaje de error
  async verificarPin(correo: string, pin: string): Promise<string | null> {
    try {
      const respuesta: any = await firstValueFrom(
        this.http.post(API_URL + '/auth/verificar', {
          correo: correo.trim().toLowerCase(),
          pin: pin.trim(),
        }),
      );
      guardarToken(respuesta.token);
      this.requiereRegistro.set(respuesta.requiereRegistro);
      return null;
    } catch (e) {
      return mensajeDeError(e);
    }
  }

  limpiarVerificacion(): void {
    borrarToken();
  }

  private arrancarEspera(): void {
    clearInterval(this.cuentaRegresiva);
    this.segundosParaReenviar.set(ESPERA_REENVIO);

    this.cuentaRegresiva = setInterval(() => {
      const quedan = this.segundosParaReenviar() - 1;
      this.segundosParaReenviar.set(quedan);

      if (quedan <= 0) {
        clearInterval(this.cuentaRegresiva);
      }
    }, 1000);
  }
}
