// PASO 1: SOLICITAR RECUPERACIÓN DE CONTRASEÑA

export interface IRecuperoPassword {
   email: string;
}

export interface IRecuperoPasswordResponse {
    message?: string;
    detail?:string;
}

// PASO 2: CONFIRMAR RECUPERACIÓN DE CONTRASEÑA
export interface IRecuperoPasswordConfirm {
    uid: string;
    token: string;
    new_password: string;
}

export interface IRecuperoPasswordConfirmResponse {
    message?: string;
    detail?:string;
}