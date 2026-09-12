import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IPedido,
  ICrearPedidoDTO,
  IActualizarPedidoDTO,
  IPatchPedidoDTO,
  EstadoPedido
} from '../models/ipedido';



@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  private readonly http = inject(HttpClient)
  private readonly apiUrl = 'http://localhost:8000/api/pedidos/'

  //permite filtrar opcionalmente por estado o por nro id de mesa
  getPedidos(estado?: EstadoPedido, mesaId?: number): Observable<IPedido[]> {
    let params = new HttpParams()

    if (estado) {
      params = params.set('estado', estado)
    }
    if (mesaId) {
      params = params.set('mesa', mesaId.toString())
    }

    return this.http.get<IPedido[]>(this.apiUrl, { params })
  }

  //por Id
  getPedidoById(id: number): Observable<IPedido> {
    return this.http.get<IPedido>(`${this.apiUrl}${id}/`)
  }

  crearPedido(pedido: ICrearPedidoDTO): Observable<IPedido> {
    return this.http.post<IPedido>(this.apiUrl, pedido)
  }

  //actualizacion completa(put)
  actualizarPedido(id: number, pedido: IActualizarPedidoDTO): Observable<IPedido> {
    return this.http.put<IPedido>(`${this.apiUrl}${id}/`, pedido)
  }

  //actualizacion parcial(patch)
  actualaizarEstadoOParcial(id: number, cambios: IPatchPedidoDTO): Observable<IPedido> {
    return this.http.patch<IPedido>(`${this.apiUrl}${id}/`, cambios)
  }

  eliminarPedido(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`)
  }

}
