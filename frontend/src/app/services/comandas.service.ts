import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { IComanda, ICrearComandaDTO, IActualizarComandaDTO } from '../models/icomandas';

@Injectable({
  providedIn: 'root',
})
export class ComandaService {

  // Ajusta el endpoint según la ruta exacta de tu backend Django/Python
  private apiUrl = 'http://localhost:8000/api/comandas/';

  private http = inject(HttpClient);

  // Retorna lista completa
  getComandas(): Observable<IComanda[]> {
    return this.http.get<IComanda[]>(this.apiUrl).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error("No se listaron las comandas", err);
        return throwError(() => new Error('No se tiene acceso a la BD'));
      })
    );
  }

  // Obtener una sola comanda por Id
  getComandaPorId(id: number): Observable<IComanda> {
    return this.http.get<IComanda>(`${this.apiUrl}${id}/`).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error(`Error al obtener la comanda con ID ${id}`, err);
        return throwError(() => err);
      })
    );
  }

  // Recibo el DTO de creación
  crearComanda(dto: ICrearComandaDTO): Observable<IComanda> {
    return this.http.post<IComanda>(this.apiUrl, dto).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log('No se registró la COMANDA', err);
        return throwError(() => err);
      })
    );
  }

  // Actualizo mediante DTO genérico
  actualizarComanda(id: number, dto: IActualizarComandaDTO): Observable<IComanda> {
    return this.http.patch<IComanda>(`${this.apiUrl}${id}/`, dto).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error("Error durante la actualización", err);
        return throwError(() => err);
      })
    );
  }

  // Método específico para el Kanban (usado en comandas.ts para mover tarjetas)
  actualizarEstado(id: number, dto: IActualizarComandaDTO): Observable<IComanda> {
    // Utiliza PATCH para modificar únicamente el campo 'estado' sin afectar el resto de la comanda
    return this.http.patch<IComanda>(`${this.apiUrl}${id}/`, dto).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error("Error al actualizar el estado de la comanda", err);
        return throwError(() => err);
      })
    );
  }

  deleteComanda(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log("No se puede eliminar la comanda", err);
        return throwError(() => err);
      })
    );
  }
}