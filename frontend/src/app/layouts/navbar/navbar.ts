import { Component, inject } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../../constants/auth.constants';

declare const google: any
@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  // 1. Inyectamos el Router de Angular
  private readonly router = inject(Router);

  // 2. Creamos la función de cierre de sesión
  logout(): void {
    // Limpiamos los tokens y los datos de usuario del almacenamiento local
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('user');

    // Desactivamos el auto-login de Google por seguridad (si aplica)
    try {
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
      }
    } catch (e) {
      console.error('Error al cerrar sesión de Google:', e);
    }

    // Redirigimos al usuario a la pantalla de login
    this.router.navigate(['/login']);
  }
}