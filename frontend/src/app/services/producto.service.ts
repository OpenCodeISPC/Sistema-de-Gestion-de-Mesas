import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { IProducto, ICrearProductoDTO, IActualizarProductoDTO } from '../models/iproducto';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {

  private apiUrl = 'http://localhost:8000/api/productos/';

  private http = inject(HttpClient)

  //retorna lista completa
  getProductos(): Observable<IProducto[]> {
    return this.http.get<IProducto[]>(this.apiUrl).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error("No se listaron los productos", err)
        return throwError(() => new Error('No se tiene acceso a la BD'))
      })
    )
  }

  //obtener un solo producto por Id
  getProductoPorId(id: number): Observable<IProducto> {
    return this.http.get<IProducto>(`${this.apiUrl}${id}/`).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('Error al obtener el producto con ID ${id}', err)
        return throwError(() => err)
      })
    )
  }

  //recibo el dto de creacion sin id ni fechas
  crearProducto(dto: ICrearProductoDTO): Observable<IProducto> {
    return this.http.post<IProducto>(this.apiUrl, dto).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log('No se registro el PRODUCTO', err)
        return throwError(() => err)
      })
    )
  }

  //actualizo mediante DTO
  actualizarProducto(id: number, dto: IActualizarProductoDTO): Observable<IProducto> {
    return this.http.patch<IProducto>(`${this.apiUrl}${id}/`, dto).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error("Error durante la actualizacion", err)
        return throwError(() => err)
      })
    )
  }

  deleteProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log("No se puede eliminar el producto", err)
        return throwError(() => err)
      })
    )
  }






}
