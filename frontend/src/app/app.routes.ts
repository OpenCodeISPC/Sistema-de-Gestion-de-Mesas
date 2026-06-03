import { Routes } from '@angular/router';
import { Caja } from './caja/caja';
import { Menu } from './menu/menu';
import { NuevoProducto } from './nuevo-producto/nuevo-producto';

export const routes: Routes = [
  { path: 'caja', component: Caja },
  { path: 'menu', component: Menu },
  { path: 'nuevo-producto', component: NuevoProducto }
];