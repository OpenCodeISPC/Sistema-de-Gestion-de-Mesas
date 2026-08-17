import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { RecuperoPassword } from './features/auth/recupero-password/recupero-password';
import { Registro } from './features/auth/registro/registro';
import { Caja } from './features/caja/caja';
import { Comandas } from './features/comandas/comandas';
import { Dashboard } from './features/home/dashboard/dashboard';
import { Mesas } from './features/mesas/mesas';




export const routes: Routes = [
  { path: '', component: Login, pathMatch: 'full' },
  { path: 'recupero-password', component: RecuperoPassword },
  { path: 'registro', component: Registro },
  { path: 'caja', component: Caja },
  { path: 'comandas', component: Comandas },
  { path: 'dashboard', component: Dashboard },
  { path: 'mesas', component: Mesas },

  //================FallBack===============================================

  { path: '**', redirectTo: '' },
];