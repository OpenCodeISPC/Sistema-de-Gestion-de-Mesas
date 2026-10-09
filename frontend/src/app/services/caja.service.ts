import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import {
  IPago,
  ICrearPagoDTO,
  ICierreCaja,
  ICierreResumen,
  ICerrarCajaDTO,
} from '../models/icaja';

@Injectable({
  providedIn: 'root',
})
export class CajaService {

  // ruta exacta de tu backend Django/Python
  private pagosUrl = 'http://localhost:8000/api/pagos/';
  private cierresUrl = 'http://localhost:8000/api/cierres/';

  private http = inject(HttpClient);

  // Retorna el listado completo de cobros registrados
  getPagos(): Observable<IPago[]> {
    return this.http.get<IPago[]>(this.pagosUrl).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error("No se listaron los pagos", err);
        return throwError(() => new Error('No se tiene acceso a la BD'));
      })
    );
  }

  // Obtener un solo pago por Id
  getPagoPorId(id: number): Observable<IPago> {
    return this.http.get<IPago>(`${this.pagosUrl}${id}/`).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error(`Error al obtener el pago con ID ${id}`, err);
        return throwError(() => err);
      })
    );
  }

  // Recibo el DTO de creaciÃ³n del cobro
  crearPago(dto: ICrearPagoDTO): Observable<IPago> {
    return this.http.post<IPago>(this.pagosUrl, dto).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log('No se registrÃ³ el PAGO', err);
        return throwError(() => err);
      })
    );
  }

  // Retorna el historial de cierres de caja registrados
  getCierres(): Observable<ICierreCaja[]> {
    return this.http.get<ICierreCaja[]>(this.cierresUrl).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error("No se listaron los cierres", err);
        return throwError(() => new Error('No se tiene acceso a la BD'));
      })
    );
  }

  // Retorna el resumen del dÃ­a (totales por mÃ©todo y estado de cierre)
  getResumenCaja(): Observable<ICierreResumen> {
    return this.http.get<ICierreResumen>(`${this.cierresUrl}resumen/`).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error("No se obtuvo el resumen de caja", err);
        return throwError(() => new Error('No se tiene acceso a la BD'));
      })
    );
  }

  // Registra el cierre de caja (solo recibe el monto rendido)
  crearCierre(dto: ICerrarCajaDTO): Observable<ICierreCaja> {
    return this.http.post<ICierreCaja>(this.cierresUrl, dto).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log('No se registrÃ³ el CIERRE', err);
        return throwError(() => err);
      })
    );
  }

  // Reabre la caja del dÃ­a (permite seguir cobrando tras un cierre)
  reabrirCaja(): Observable<{ fecha: string; reabierta: boolean }> {
    return this.http.post<{ fecha: string; reabierta: boolean }>(`${this.cierresUrl}reabrir/`, {}).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log('No se reabriÃ³ la CAJA', err);
        return throwError(() => err);
      })
    );
  }
  // Exportar resumen de cierre en PDF
  exportarCierrePdf(idCierre: number): Observable<Blob> {
    return this.http.get(${this.cierresUrl}/exportar-pdf/, {
      responseType: 'blob'
    });
  }
}





