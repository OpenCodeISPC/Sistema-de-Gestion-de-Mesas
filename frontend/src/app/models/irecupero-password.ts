// PASO 1: SOLICITAR CÓDIGO OTP POR CORREO

export interface IRecuperoPassword {
   email: string;
}

export interface IRecuperoPasswordResponse {
    message?: string;
    detail?:string;
}

// PASO 2: VERIFICAR CÓDIGO OTP
export interface IVerificarOtp {
    email: string;
    codigo: string;
}

// PASO 3: CONFIRMAR NUEVA CONTRASEÑA
export interface IRecuperoPasswordConfirm extends IVerificarOtp {
    new_password: string;
}

export interface IRecuperoPasswordConfirmResponse {
    message?: string;
    detail?:string;
}
