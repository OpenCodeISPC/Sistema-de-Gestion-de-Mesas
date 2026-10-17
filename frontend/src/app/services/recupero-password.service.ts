import {Injectable,inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
    IRecuperoPassword,
    IRecuperoPasswordResponse,
    IVerificarOtp,
    IRecuperoPasswordConfirm,
    IRecuperoPasswordConfirmResponse
} from '../models/irecupero-password';
import { environments } from '../../environments/environments';

@Injectable({
    providedIn: 'root',
})

export class RecuperoPasswordService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environments.apiUrl}/api/auth/`; //url de django

    // Paso 1: el backend genera el código OTP y lo envía al correo
    solicitarRecuperoPassword(data:IRecuperoPassword): Observable<IRecuperoPasswordResponse> {
        return this.http.post<IRecuperoPasswordResponse>(`${this.apiUrl}password-reset/`, data);
    }

    // Paso 2: valida el código OTP sin consumirlo
    verificarCodigo(data:IVerificarOtp): Observable<IRecuperoPasswordResponse> {
        return this.http.post<IRecuperoPasswordResponse>(`${this.apiUrl}password-reset/verificar/`, data);
    }

    // Paso 3: guarda la nueva contraseña y consume el código OTP
    restablecerPassword(data:IRecuperoPasswordConfirm): Observable<IRecuperoPasswordConfirmResponse> {
        return this.http.post<IRecuperoPasswordConfirmResponse>(`${this.apiUrl}password-reset-confirm/`, data);
    }
}
