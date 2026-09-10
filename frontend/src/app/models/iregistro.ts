export type RolUser= 'ADMIN' | 'MOZO'| 'CAJERO' | 'COCINA';
export type OauthProvider = 'google';

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
// Opcion A: Registro mediante email y contraseña
export interface IRegistroRequest{  
    nombre: string;
    apellido: string;
    email: string;
    rol: RolUser;
    password: string;
}
// Opción B: Registro mediante OAuth (Google)
export interface IOauthRegistroRequest{
    provider: OauthProvider;
    token:string;
    rol?: RolUser;
}

export type RegistroPayload = IRegistroRequest | IOauthRegistroRequest;

// 3. RESPUESTA DEL REGISTRO
// Si el backend devuelve el usuario creado, reutilizá IUsuario:
export interface IRegistroResponse {
    user: IUser;
    access?:string;
    refresh?: string;
}
