import { Routes } from '@angular/router';
import { Caja } from './caja/caja';
import { Menu } from './menu/menu';
import { NuevoProducto } from './nuevo-producto/nuevo-producto';
import { Mesas } from './features/mesas/mesas';
import { Servicios } from './features/servicios/servicios';
import { Pedidos } from './features/pedidos/pedidos';

export const routes: Routes = [
  { path: 'caja', component: Caja },
  { path: 'menu', component: Menu },
  { path: 'nuevo-producto', component: NuevoProducto },
  { path: 'mesas', component: Mesas},
  { path: 'servicios', component: Servicios},
  { path: 'pedidos', component: Pedidos}
];