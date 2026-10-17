import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, catchError, throwError} from 'rxjs';
import {ILoginRequest,ILoginResponse,IRefreshTokenRequest,IOauthRequest,IRefreshTokenResponse} from '../models/ilogin';
import { environments } from '../../environments/environments';

@Injectable({
    providedIn: 'root',
})
export class LoginService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environments.apiUrl}/api/auth/`; //url de django

    login(data:ILoginRequest): Observable<ILoginResponse> {
        return this.http.post<ILoginResponse>(`${this.apiUrl}login/`, data);
    }

    loginOauth(data:IOauthRequest): Observable<ILoginResponse> {
        return this.http.post<ILoginResponse>(`${this.apiUrl}login-oauth/`, data);
    }
    refreshToken(data:IRefreshTokenRequest): Observable<IRefreshTokenResponse> {
        return this.http.post<IRefreshTokenResponse>(`${this.apiUrl}token/refresh/`, data);
    }
}