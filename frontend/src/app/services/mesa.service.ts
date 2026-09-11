import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IMesa,
  ICrearMesaDTO,
  IActualizarMesaDTO,
  IPatchMesaDTO,
  EstadoMesa
} from '../models/imesa';

@Injectable({
  providedIn: 'root',
})
export class MesaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000/api/mesas/';

  /**
   * Obtiene la lista de mesas con la opción de filtrar por estado
   * @param estado Estado opcional ('LIBRE' | 'OCUPADA' | 'RESERVADA' | 'CERRADA')
   */
  getMesas(estado?: EstadoMesa): Observable<IMesa[]> {
    let params = new HttpParams();

    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<IMesa[]>(this.apiUrl, { params });
  }

  /**
   * Obtiene el detalle de una mesa por su ID
   */
  getMesaById(id: number): Observable<IMesa> {
    return this.http.get<IMesa>(`${this.apiUrl}${id}/`);
  }

  /**
   * Crea una nueva mesa
   */
  crearMesa(mesa: ICrearMesaDTO): Observable<IMesa> {
    return this.http.post<IMesa>(this.apiUrl, mesa);
  }

  /**
   * Actualización completa de una mesa (PUT)
   */
  actualizarMesa(id: number, mesa: IActualizarMesaDTO): Observable<IMesa> {
    return this.http.put<IMesa>(`${this.apiUrl}${id}/`, mesa);
  }

  /**
   * Actualización parcial o cambio de estado de una mesa (PATCH)
   * Útil para cuando un mozo abre/cierra una mesa o cambia su estado a OCUPADA
   */
  actualizarEstadoOParcial(id: number, cambios: IPatchMesaDTO): Observable<IMesa> {
    return this.http.patch<IMesa>(`${this.apiUrl}${id}/`, cambios);
  }

  /**
   * Elimina una mesa por ID
   */
  eliminarMesa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }
}