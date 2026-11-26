import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL, mensajeDeError } from '../config/api';

// un documento que el usuario subio para verificar su cuenta
export interface MiDocumento {
  id: string;
  tipoDocumento: string;
  numero: string;
  fechaSubida: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  // lo que escribio el moderador, por ejemplo por que lo rechazo
  observacion: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentosService {
  private http = inject(HttpClient);

  // los tipos de documento que acepta el MID
  tiposDocumento = ['Cédula de ciudadanía', 'Cédula de extranjería'];

  // trae los documentos del usuario con la sesion abierta
  async obtenerMios(): Promise<MiDocumento[]> {
    const documentos: any = await firstValueFrom(this.http.get(API_URL + '/documentos/mio'));
    return documentos;
  }

  // sube el documento, devuelve null si salio bien o el mensaje de error
  async subir(tipoDocumento: string, numero: string, archivo: string, archivoReverso: string): Promise<string | null> {
    try {
      await firstValueFrom(
        this.http.post(API_URL + '/documentos', {
          tipoDocumento: tipoDocumento,
          numero: numero.trim(),
          archivo: archivo,
          archivoReverso: archivoReverso,
        }),
      );
      return null;
    } catch (e) {
      return mensajeDeError(e);
    }
  }
}
