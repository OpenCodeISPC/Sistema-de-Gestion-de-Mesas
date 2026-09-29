export type EstadoComanda = 'PENDIENTE' | 'PREPARACION' | 'LISTO';
export type SectorComanda = 'COCINA' | 'BARRA';

// Interfaz para cada ítem dentro de un pedido
export interface IDetalleComanda {
  id_detalle?: number;
  producto_nombre: string;
  comentario?: string;
}

// Interfaz principal de la comanda
export interface IComanda {
  id_comanda?: number;
  numero_mesa: number;
  numero_pedido: number;
  tiempo_espera?: string;
  estado: EstadoComanda;
  sector: SectorComanda;
  cliente?: string;
  creado_en?: string; 
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