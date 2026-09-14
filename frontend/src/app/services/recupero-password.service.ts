import {Injectable,inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {IRecuperoPassword, IRecuperoPasswordResponse, IRecuperoPasswordConfirm, IRecuperoPasswordConfirmResponse} from '../models/irecupero-password';

@Injectable({
    providedIn: 'root',
})

export class RecuperoPasswordService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8000/api/auth/recupero-password/'; //url de django

    solicitarRecuperoPassword(data:IRecuperoPassword): Observable<IRecuperoPasswordResponse> {
        return this.http.post<IRecuperoPasswordResponse>(`${this.apiUrl}password-reset/`, data);
    }

    restablecerPassword(data:IRecuperoPasswordConfirm): Observable<IRecuperoPasswordConfirmResponse> {
        return this.http.post<IRecuperoPasswordConfirmResponse>(`${this.apiUrl}password-reset-confirm/`, data);
    }
}