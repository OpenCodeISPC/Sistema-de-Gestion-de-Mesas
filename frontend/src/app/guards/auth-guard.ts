import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_TOKEN_KEY } from '../constants/auth.constants';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  // Si existe un token, permitimos el acceso a la ruta
  if (token) {
    return true;
  }

  // Si no hay token, redirigimos al login y bloqueamos la navegación
  router.navigate(['/login']); // O simplemente [''] ya que la raíz es el login
  return false;
};