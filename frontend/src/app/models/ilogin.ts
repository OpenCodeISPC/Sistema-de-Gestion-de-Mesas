import { IUser } from "./iregistro";

export type OauthProvider = 'google';

// 1. DTO PARA LOGIN (POST - Lo que envías al backend)
export interface ILoginRequest {
    email: string;
    password: string;
}

export interface IOauthRequest{
    provider: OauthProvider;
    token:string;
}

export type LoginPayload = ILoginRequest | IOauthRequest;

// 2. RESPUESTA DEL LOGIN (Lo que devuelve Django con SimpleJWT/Token)

export interface ILoginResponse {
    access: string;
    refresh?: string;
    user?: IUser;
}
// 3. REFRESCO DE TOKEN (Vital para el ciclo de vida de JWT)
export interface IRefreshTokenRequest {
    refresh: string;
}
export interface IRefreshTokenResponse {
    access: string;
}