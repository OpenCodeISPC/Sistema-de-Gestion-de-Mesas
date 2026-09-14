export type EstadoMesa = 'LIBRE' | 'OCUPADA' | 'RESERVADA' | 'CERRADA';

export interface IMesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: EstadoMesa;
  ubicacion?: string | null;
}

// DTO para la creación de una mesa (el id lo asigna Django automáticamente)
export interface ICrearMesaDTO {
  numero: number;
  capacidad: number;
  estado?: EstadoMesa;
  ubicacion?: string | null;
}

// DTO para actualización completa (PUT)
export interface IActualizarMesaDTO {
  numero: number;
  capacidad: number;
  estado: EstadoMesa;
  ubicacion?: string | null;
}

// DTO para cambios parciales (PATCH), ideal para cambiar solo el estado o ubicación
export interface IPatchMesaDTO {
  numero?: number;
  capacidad?: number;
  estado?: EstadoMesa;
  ubicacion?: string | null;
}