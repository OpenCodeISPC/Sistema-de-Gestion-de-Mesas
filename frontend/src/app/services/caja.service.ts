import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { IPago, ICrearPagoDTO } from '../models/icaja';

@Injectable({
  providedIn: 'root',
})
export class CajaService {

  // ruta exacta de tu backend Django/Python
  private apiUrl = 'http://localhost:8000/api/pagos/';

  private http = inject(HttpClient);

  // Retorna el listado completo de cobros registrados
  getPagos(): Observable<IPago[]> {
    return this.http.get<IPago[]>(this.apiUrl).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error("No se listaron los pagos", err);
        return throwError(() => new Error('No se tiene acceso a la BD'));
      })
    );
  }

  // Obtener un solo pago por Id
  getPagoPorId(id: number): Observable<IPago> {
    return this.http.get<IPago>(`${this.apiUrl}${id}/`).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error(`Error al obtener el pago con ID ${id}`, err);
        return throwError(() => err);
      })
    );
  }

  // Recibo el DTO de creación del cobro
  crearPago(dto: ICrearPagoDTO): Observable<IPago> {
    return this.http.post<IPago>(this.apiUrl, dto).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log('No se registró el PAGO', err);
        return throwError(() => err);
      })
    );
  }
}