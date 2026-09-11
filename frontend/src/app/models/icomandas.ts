

// Definimos los estados para que coincidan con las tres columnas de tu HTML
export type EstadoComanda = 'PENDIENTE' | 'PREPARACION' | 'LISTO';

// Definimos los sectores para el switch superior
export type SectorComanda = 'COCINA' | 'BARRA';

// Interfaz para cada plato o ítem dentro de un pedido
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
  detalles: IDetalleComanda[]; 
}

// DTO para crear una nueva comanda
export interface ICrearComandaDTO {
  numero_mesa: number;
  sector: SectorComanda;
  detalles: IDetalleComanda[];
  
}

// DTO para actualizar una comanda (ej. al moverla de "Pendiente" a "Preparación")
export interface IActualizarComandaDTO {
  estado?: EstadoComanda;
  numero_mesa?: number;
  
}
