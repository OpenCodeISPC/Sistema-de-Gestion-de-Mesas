import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { IMesa, ICrearMesaDTO, IActualizarMesaDTO, IPatchMesaDTO } from '../models/imesa';

@Injectable({
  providedIn: 'root',
})
export class MesaService {

  private apiUrl = 'http://localhost:8000/api/mesas/';

  private http = inject(HttpClient);

  // retorna lista completa
  getMesas(): Observable<IMesa[]> {
    return this.http.get<IMesa[]>(this.apiUrl).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error("No se listaron las mesas", err);
        return throwError(() => new Error('No se tiene acceso a la BD'));
      })
    );
  }

  // obtener una sola mesa por Id
  getMesaPorId(id: number): Observable<IMesa> {
    return this.http.get<IMesa>(`${this.apiUrl}${id}/`).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error(`Error al obtener la mesa con ID ${id}`, err);
        return throwError(() => err);
      })
    );
  }

  // recibo el dto de creacion sin id ni fechas
  crearMesa(dto: ICrearMesaDTO): Observable<IMesa> {
    return this.http.post<IMesa>(this.apiUrl, dto).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log('No se registro la MESA', err);
        return throwError(() => err);
      })
    );
  }

  // actualizo mediante DTO
  actualizarMesa(id: number, dto: IActualizarMesaDTO): Observable<IMesa> {
    return this.http.patch<IMesa>(`${this.apiUrl}${id}/`, dto).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error("Error durante la actualizacion", err);
        return throwError(() => err);
      })
    );
  }

  deleteMesa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log("No se puede eliminar la mesa", err);
        return throwError(() => err);
      })
    );
  }

}