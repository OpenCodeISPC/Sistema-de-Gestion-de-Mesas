import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { RecuperoPassword } from './features/auth/recupero-password/recupero-password';
import { Registro } from './features/auth/registro/registro';
import { Bar } from './features/bar/bar';
import { Caja } from './features/caja/caja';
import { Cocina } from './features/cocina/cocina';
import { Dashboard } from './features/home/dashboard/dashboard';
import { Mesas } from './features/mesas/mesas';
import { Pedidos } from './features/pedidos/pedidos';


export const routes: Routes = [
  { path: '', component: Login, pathMatch: 'full' },
  { path: 'recupero-password', component: RecuperoPassword },
  { path: 'registro', component: Registro },
  { path: 'bar', component: Bar },
  { path: 'caja', component: Caja },
  { path: 'cocina', component: Cocina },
  { path: 'dashboard', component: Dashboard },
  { path: 'mesas', component: Mesas },
  { path: 'pedidos', component: Pedidos },

  //================FallBack===============================================

  { path: '**', redirectTo: '' },
];