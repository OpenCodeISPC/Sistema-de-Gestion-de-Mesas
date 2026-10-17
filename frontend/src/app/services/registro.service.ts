import {Injectable,inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {IRegistroRequest, IRegistroResponse,IOauthRegistroRequest} from '../models/iregistro';
import { environments } from '../../environments/environments';

@Injectable({
    providedIn: 'root',
})

export class RegistroService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environments.apiUrl}/api/auth/`; //url de django

    registrarUsuario(data:IRegistroRequest): Observable<IRegistroResponse> {
        return this.http.post<IRegistroResponse>(`${this.apiUrl}registro/`, data);
    }
}
