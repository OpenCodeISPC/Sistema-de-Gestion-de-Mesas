// Tipos de método de pago (coinciden con las choices del modelo Pago del backend)
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO';

//--------------------------------------------------------------------------
// INTERFAZ PARA LECTURA (GET) - Respuesta del backend en /api/pagos/
//--------------------------------------------------------------------------
export interface IPago {
  id_pago: number;
  pedido: number;
  numero_mesa: number;
  estado_pedido: string;
  metodo_pago: MetodoPago;
  monto: number;
  propina: number;
  importe_recibido: number;
  fecha_hora: string;
  cajero: number | null;
  nombre_cajero: string | null;
  observaciones?: string | null;
}

//--------------------------------------------------------------------------
// DTO PARA ESCRITURA (POST / PATCH) - Solo se envía el ID del pedido
//--------------------------------------------------------------------------
export interface ICrearPagoDTO {
  pedido: number;
  metodo_pago: MetodoPago;
  monto: number;
  propina?: number;
  importe_recibido?: number;
  observaciones?: string | null;
}

//--------------------------------------------------------------------------
// CIERRE DE CAJA - Lectura (GET /api/cierres/)
//--------------------------------------------------------------------------
export interface ICierreCaja {
  id_cierre: number;
  fecha_hora: string;
  fecha_cierre: string;
  cajero: number | null;
  nombre_cajero: string | null;
  monto_efectivo: number;
  monto_tarjeta: number;
  monto_transferencia: number;
  monto_otro: number;
  total_cobrado: number;
  total_rendido: number;
  diferencia: number;
  observaciones?: string | null;
}

//--------------------------------------------------------------------------
// Resumen del día (GET /api/cierres/resumen/)
//--------------------------------------------------------------------------
export interface ICierreResumen {
  fecha: string;
  monto_efectivo: number;
  monto_tarjeta: number;
  monto_transferencia: number;
  monto_otro: number;
  total_cobrado: number;
  total_pagos: number;
  cerrado: boolean;
  cierre: ICierreCaja | null;
}

//--------------------------------------------------------------------------
// DTO PARA ESCRITURA (POST /api/cierres/) - Solo declara lo que rinde el cajero
//--------------------------------------------------------------------------
export interface ICerrarCajaDTO {
  total_rendido: number;
  observaciones?: string | null;
}