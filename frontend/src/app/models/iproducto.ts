/*Igual al models
id_producto?: number; Opcional (?) para cuando creas un producto nuevo que aún no tiene ID de la BD
descripcion?: string | null; Opcional o null porque en Django tiene blank=True, null=True
precio: number; Django DecimalField se serializa como number o string en JSON, lo ideal es number en TS
creado_en?: string; Fechas enviadas por Django como strings en formato ISO (YYYY-MM-DDTHH:mm:ssZ) */

//INTERFAZ PRINCIPAL - Respuesta de la API
export interface IProducto {
    id_producto?: number;
    nombre: string;
    descripcion?: string | null;
    precio: number;
    stock: number;
    categoria: string;
    disponibilidad: boolean;
    creado_en?: string;
    actualizado_en?: string;
}


//DTOs para crear producto(post)
//escluimos los campos autogenerados por la bd(id, timestamps)
export interface ICrearProductoDTO {
    nombre: string;
    descripcion?: string | null;
    precio: number;
    stock: number;
    categoria: string;
    disponibilidad: boolean;
}

//DTOs actualizar producto completo(put)
export type IActualizarProductoDTO = ICrearProductoDTO;

//DTO actualizar parcial (patch)
//los campos editables se vuelven opcionales
export type IPatchProductoDTO = Partial<ICrearProductoDTO>