import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { RecuperoPassword } from './features/auth/recupero-password/recupero-password';
import { Registro } from './features/auth/registro/registro';
import { Caja } from './features/caja/caja';
import { Comandas } from './features/comandas/comandas';
import { Dashboard } from './features/home/dashboard/dashboard';
import { Mesas } from './features/mesas/mesas';
import { Pedidos } from './features/mesas/pedidos/pedidos';
import { Producto } from './features/producto/producto';
import { authGuard } from './guards/auth-guard';


export const routes: Routes = [
  //-----Publicas-------
  { path: '', component: Login, pathMatch: 'full' },
  { path: 'recupero-password', component: RecuperoPassword },
  { path: 'registro', component: Registro },

  //------Privadas----------------
  { path: 'caja', component: Caja, canActivate: [authGuard] },
  { path: 'comandas', component: Comandas, canActivate: [authGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'mesas', component: Mesas, canActivate: [authGuard] },
  { path: 'pedidos', component: Pedidos, canActivate: [authGuard] },
  { path: 'producto', component: Producto, canActivate: [authGuard] },

  //================FallBack===============================================
  { path: '**', redirectTo: '' },
];