import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants/auth.constants'; // Ajusta tu ruta de constantes

declare const google: any

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);

  // Comprueba si el usuario está autenticado verificando el token
  isLoggedIn(): boolean {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  }

  // Devuelve los datos del usuario guardados en el almacenamiento local
  getUsuarioActual() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Cierre de sesión centralizado y limpio
  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('user');

    // Desactivar Google SDK si está presente
    try {
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
      }
    } catch (e) {
      console.error('Error al cerrar sesión de Google:', e);
    }

    // Redirigir al login
    this.router.navigate(['/login']);
  }
}