/**
 * auth.interceptor.ts
 * --------------------
 * Interceptor HTTP funcional (Angular 17+) que:
 *
 *   1. Adjunta el JWT access token guardado en localStorage como header
 *      `Authorization: Bearer <token>` en cada request saliente.
 *   2. Si el backend responde 401 y el request que falló no es el propio
 *      refresh, pide un access token nuevo usando el refresh token, lo
 *      guarda y reintenta automáticamente el request original — sin que
 *      el usuario tenga que volver a loguearse.
 *   3. El backend usa ROTATE_REFRESH_TOKENS=True, por eso al refrescar
 *      también se guarda el refresh token nuevo que devuelve la
 *      respuesta: el viejo queda invalidado (blacklist) apenas se usa.
 *   4. Si el refresh también falla (token expirado o revocado), limpia
 *      la sesión de localStorage y deja que el 401 siga su curso normal
 *      (típicamente el guard de rutas redirige a /login).
 *
 * Las keys de localStorage se importan desde auth.constants.ts en vez de
 * hardcodear strings: antes el login guardaba bajo una key y el
 * interceptor leía otra, lo que rompía la sesión de forma silenciosa.
 */
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { LoginService } from '../services/login.service';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants/auth.constants';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const accessToken = localStorage.getItem(AUTH_TOKEN_KEY);

  const authReq = accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si no es 401, o el request que falló ES el propio refresh, no reintentamos
      if (error.status !== 401 || req.url.includes('/token/refresh/')) {
        return throwError(() => error);
      }

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        // No hay refresh token: mandamos al usuario a loguearse de nuevo
        localStorage.removeItem(AUTH_TOKEN_KEY);
        return throwError(() => error);
      }

      return loginService.refreshToken({ refresh: refreshToken }).pipe(
        switchMap((res) => {
          localStorage.setItem(AUTH_TOKEN_KEY, res.access);
          // Con ROTATE_REFRESH_TOKENS=True el backend devuelve un refresh nuevo también
          if (res.refresh) {
            localStorage.setItem(REFRESH_TOKEN_KEY, res.refresh);
          }
          const retriedReq = req.clone({
            setHeaders: { Authorization: `Bearer ${res.access}` },
          });
          return next(retriedReq);
        }),
        catchError((refreshError) => {
          // El refresh también falló (expiró o es inválido): limpiar sesión
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          return throwError(() => refreshError);
        })
      );
    })
  );
};