import { Routes } from '@angular/router';

import { CajaComponent } from './pages/caja/caja.component';
import { MenuComponent } from './pages/menu/menu.component';
import { NuevoProductoComponent } from './pages/nuevo-producto/nuevo-producto.component';

export const routes: Routes = [
  { path: 'caja', component: CajaComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'nuevo-producto', component: NuevoProductoComponent }
];