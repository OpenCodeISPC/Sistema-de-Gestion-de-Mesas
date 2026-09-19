import { IProducto } from "./iproducto";

export type EstadoPedido =
    | 'PENDIENTE'
    | 'PREPARACION'
    | 'LISTO'
    | 'ENTREGADO'
    | 'CERRADO'
    | 'CANCELADO';


//-----------------------------------------------------------------------------
// INTERFACES PARA LECTURA (GET) backend envia objetos completo para la UI
//-----------------------------------------------------------------------------
export interface IDetallePedido {
    id_detalle_pedido: number;
    pedido: number;
    producto: IProducto; //objeto completo
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    observaciones?: string | null
}

export interface IPedido {
    id_pedido: number;
    fecha_hora: string;
    estado: EstadoPedido;
    total: number;
    mesa: number; // puedo agregar IMesa
    usuario: number; //puedo agregar IUsuario cuando este listo
    detalles: IDetallePedido[];
}

//-------------------------------------------------------------------------------------------
// DTOs PARA ESCRITURA (POST / PUT / PATHC) a backend SOLO se le envia los IDs de referencias
// ------------------------------------------------------------------------------------------
export interface ICrearDetallePedidoDTO {
    producto: number; //solo ID de producto
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    observaciones?: string | null;
}

export interface ICrearPedidoDTO {
    mesa: number;
    usuario: number;
    estado?: EstadoPedido;
    total?: number;
    detalles?: ICrearDetallePedidoDTO[];
}

export type IActualizarPedidoDTO = Partial<ICrearPedidoDTO>;
export type IPatchPedidoDTO = Partial<ICrearPedidoDTO>;
