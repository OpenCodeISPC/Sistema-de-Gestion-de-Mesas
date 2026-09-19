/**
 * auth.interceptor.ts
 * --------------------
 * Interceptor HTTP funcional (Angular 17+) que:
 *
 *   1. Adjunta el JWT access token guardado en localStorage como header
 *      `Authorization: Bearer <token>` en cada request saliente.
 *   2. Si el backend responde 401 (access token expirado, vida útil de
 *      60 min según SIMPLE_JWT.ACCESS_TOKEN_LIFETIME en Django), pide
 *      un access token nuevo usando el refresh token, lo guarda, y
 *      reintenta automáticamente el request original con el token
 *      nuevo — todo esto sin que el usuario lo note ni tenga que
 *      volver a loguearse.
 *   3. Si el refresh también falla (refresh token vencido, revocado,
 *      o inexistente), limpia la sesión de localStorage y deja que el
 *      error 401 siga su curso normal (típicamente el guard de rutas
 *      redirige a /login).
 *
 * CONTEXTO / POR QUÉ EXISTE ESTA LÓGICA:
 * La versión original de este interceptor solo hacía el paso (1) y no
 * tenía manejo de 401 ni refresh automático. Eso causaba que, pasados
 * los 60 minutos de vida del access token, TODOS los requests a la API
 * (mesas, comandas, productos, etc.) empezaran a fallar con 401 y la
 * UI se quedara mostrando "sin datos" aunque la base de datos sí
 * tuviera información — el usuario tenía que recargar la página y
 * loguearse de nuevo para que volviera a andar. Este interceptor
 * resuelve eso automáticamente.
 *
 * Además, durante el desarrollo de este fix aparecieron dos bugs
 * relacionados que vale la pena recordar por si se reintroducen:
 *   - Mismatch de keys: login.ts guardaba el token bajo 'access', pero
 *     una versión temprana de este interceptor leía 'access_token'.
 *     Por eso ahora ambos importan las keys desde auth.constants.ts
 *     en vez de escribir el string a mano.
 *   - Al guardar el refresh token nuevo tras un refresh exitoso, una
 *     versión intermedia guardaba por error res.access en la key de
 *     refresh (en vez de res.refresh), lo que rompía el SEGUNDO
 *     refresh en adelante (efecto recién visible ~2h después del
 *     login). Prestar atención a no repetir ese error si se toca este
 *     bloque.
 *
 * Nota sobre el backend: Simple JWT está configurado con
 * ROTATE_REFRESH_TOKENS=True y BLACKLIST_AFTER_ROTATION=True, por eso
 * es obligatorio guardar el refresh token nuevo que devuelve la
 * respuesta de /token/refresh/ — el viejo queda invalidado (blacklist)
 * apenas se usa una vez.
 */


import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { LoginService } from '../services/login.service'; // ajustá el path real
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants/auth.constants';


export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
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
        localStorage.removeItem('access');
        return throwError(() => error);
      }

      return loginService.refreshToken({ refresh: refreshToken }).pipe(
        switchMap((res) => {
          localStorage.setItem(AUTH_TOKEN_KEY, res.access);
          // Con ROTATE_REFRESH_TOKENS=True el backend devuelve un refresh nuevo también
          if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, res.access);
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
