// src/app/models/icomandas.ts

export type EstadoComanda = 'PENDIENTE' | 'PREPARACION' | 'LISTO';
export type SectorComanda = 'COCINA' | 'BARRA';

export interface IDetalleComanda {
  id_detalle?: number;
  id_detalle_pedido?: number;
  producto_nombre?: string;
  producto?: { nombre: string };
  cantidad?: number;
  comentario?: string;
  observaciones?: string;
}

export interface IComanda {
  id_comanda?: number;
  id_pedido?: number;
  numero_mesa?: number;
  mesa?: number | string;
  numero_pedido?: number;
  tiempo_espera?: string;
  estado: EstadoComanda;
  sector: SectorComanda;
  cliente?: string;
  creado_en?: string;
  fecha_hora?: string;
  detalles?: IDetalleComanda[];
}

export interface ICrearComandaDTO {
  numero_mesa: number;
  sector: SectorComanda;
  detalles: IDetalleComanda[];
}

export interface IActualizarComandaDTO {
  estado?: EstadoComanda;
  numero_mesa?: number;
}