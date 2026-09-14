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