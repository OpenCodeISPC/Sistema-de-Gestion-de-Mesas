export type RolUser= 'ADMIN' | 'MOZO'| 'CAJERO' | 'COCINA';

//1.MODELO BASE / LECTURA (GET o Respuesta del Backend)
export interface IUser{
    id?: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: RolUser;
    is_active: boolean;
    is_staff: boolean;
    fecha_creacion?: string;
}

// 2. DTO PARA REGISTRO (POST)
// Hereda los campos necesarios de IUsuario y agrega las contraseñas
export interface IRegistroRequest{  
    nombre: string;
    apellido: string;
    email: string;
    rol: RolUser;
    password: string;
}

// 3. RESPUESTA DEL REGISTRO
// Si el backend devuelve el usuario creado, reutilizá IUsuario:
export type IRegistroResponse = IUser;