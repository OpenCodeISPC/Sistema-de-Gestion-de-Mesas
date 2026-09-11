import { Component, inject, signal, computed, effect, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IPedido, IDetallePedido, EstadoPedido } from '../../../models/ipedido';
import { IProducto } from '../../../models/iproducto';
import { PedidoService } from '../../../services/pedido.service';
import { ProductoService } from '../../../services/producto.service';
import { WebsocketService } from '../../../services/websocket.service';

@Component({
  selector: 'app-pedidos',
  imports: [CommonModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {
  private readonly pedidoService = inject(PedidoService);
  private readonly productoService = inject(ProductoService);
  private readonly wsService = inject(WebsocketService);

  // INPUTS / OUTPUTS (comunicación con el padre: Mesas)
  mesaId = input<number | null>(null);
  numeroMesa = input<number | string>('01');
  alCerrar = output<void>();
  alAgregarProducto = output<string>();

  // Signals de estado
  pedidoActual = signal<IPedido | null>(null);
  detallesLocales = signal<IDetallePedido[]>([]);
  productosDisponibles = signal<IProducto[]>([]);

  // Estado de despliegue de categoría (acordeón)
  barraAbierta = signal<boolean>(true);
  cocinaAbierta = signal<boolean>(true);

  categoriaEnSeleccion = signal<'barra' | 'cocina' | null>(null);

  // Filtra productos de BD según categoría seleccionada (En plural)
  productosParaAgregar = computed(() => {
    const cat = this.categoriaEnSeleccion();
    if (!cat) return [];

    return this.productosDisponibles().filter(p => {
      const pCat = p.categoria?.toLowerCase() || '';
      return cat === 'barra' ? pCat === 'barra' : pCat !== 'barra';
    });
  });

  // Signals computadas para listas de comanda
  detallesBarra = computed(() => {
    return this.detallesLocales().filter(
      item => item.producto.categoria?.toLowerCase() === 'barra'
    );
  });

  // Corregido a plural para matchear con el HTML: detallesCocina
  detallesCocina = computed(() => {
    return this.detallesLocales().filter(
      item => item.producto.categoria?.toLowerCase() !== 'barra'
    );
  });

  totalCalculado = computed(() => {
    return this.detallesLocales().reduce((acc, item) => {
      return acc + (item.cantidad * item.precio_unitario);
    }, 0);
  });

  constructor() {
    effect(() => {
      const id = this.mesaId();
      if (id) {
        this.cargarPedidoDeMesa(id);
      } else {
        this.limpiarPanel();
      }
    });

    effect(() => {
      const evento = this.wsService.ultimoEvento();
      if (!evento) return;

      if (
        (evento.type === 'PEDIDO_CREADO' || evento.type === 'PEDIDO_ESTADO_CAMBIADO') &&
        evento.data.mesa === this.mesaId()
      ) {
        this.pedidoActual.set(evento.data);
        this.detallesLocales.set(evento.data.detalles || []);
      }
    });
  }

  ngOnInit(): void {
    this.cargarProductoBD();
  }

  // Carga de catálogo de productos
  cargarProductoBD(): void {
    this.productoService.getProductos().subscribe({
      next: (prods) => this.productosDisponibles.set(prods),
      error: (err) => console.error('Error al cargar productos:', err)
    });
  }

  cargarPedidoDeMesa(idMesa: number): void {
    this.pedidoService.getPedidos(undefined, idMesa).subscribe({
      next: (pedidos) => {
        const pedidoActivo = pedidos.find(p => p.estado !== 'CERRADO' && p.estado !== 'CANCELADO');
        if (pedidoActivo) {
          this.pedidoActual.set(pedidoActivo);
          this.detallesLocales.set(pedidoActivo.detalles || []);
        } else {
          this.limpiarPanel();
        }
      },
      error: (err) => console.error('Error cargando pedido:', err)
    });
  }

  limpiarPanel(): void {
    this.pedidoActual.set(null);
    this.detallesLocales.set([]);
    this.categoriaEnSeleccion.set(null);
  }

  cerrarPanel(): void {
    this.alCerrar.emit();
  }

  toggleBarra(): void {
    this.barraAbierta.update(val => !val);
  }

  toggleCocina(): void {
    this.cocinaAbierta.update(val => !val);
  }

  // Métodos para agregar productos dinámicamente desde el selector
  abrirSelectorProducto(categoria: 'barra' | 'cocina'): void {
    this.categoriaEnSeleccion.set(categoria);
  }

  seleccionarProducto(producto: IProducto): void {
    if (!producto) return;

    const detalles = this.detallesLocales();
    const existente = detalles.find(d => d.producto.id_producto === producto.id_producto);

    if (existente) {
      this.modificarCantidad(existente.id_detalle_pedido, 1);
    } else {
      const nuevoDetalle: IDetallePedido = {
        id_detalle_pedido: Date.now(),
        pedido: this.pedidoActual()?.id_pedido || 0,
        producto: producto,
        cantidad: 1,
        precio_unitario: producto.precio,
        subtotal: producto.precio,
        observaciones: ''
      };

      this.detallesLocales.update(items => [...items, nuevoDetalle]);
    }

    this.categoriaEnSeleccion.set(null);
  }

  modificarCantidad(idDetalle: number, cambio: number): void {
    this.detallesLocales.update(detalles => {
      return detalles.map(item => {
        if (item.id_detalle_pedido === idDetalle) {
          const nuevaCantidad = item.cantidad + cambio;
          if (nuevaCantidad <= 0) return item;

          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precio_unitario
          };
        }
        return item;
      });
    });
  }

  eliminarProducto(idDetalle: number): void {
    this.detallesLocales.update(detalles =>
      detalles.filter(item => item.id_detalle_pedido !== idDetalle)
    );
  }

  confirmarPedido(): void {
    const pedido = this.pedidoActual();
    const detalles = this.detallesLocales();

    if (!detalles.length) {
      alert('Debe agregar al menos un producto antes de confirmar');
      return;
    }

    const detallesPayload = detalles
      .filter(d => d.producto && d.producto.id_producto !== undefined)
      .map(d => ({
        producto: d.producto.id_producto!,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.subtotal,
        observaciones: d.observaciones
      }));

    if (pedido) {
      const payload = {
        estado: 'PREPARACION' as EstadoPedido,
        total: this.totalCalculado(),
        detalles: detallesPayload
      };

      this.pedidoService.actualizarPedido(pedido.id_pedido, payload).subscribe({
        next: (pedidoActualizado) => {
          this.pedidoActual.set(pedidoActualizado);
          console.log('Pedido actualizado correctamente');
        },
        error: (err) => console.error('Error al actualizar pedido:', err)
      });
    } else if (this.mesaId()) {
      const payload = {
        mesa: this.mesaId()!,
        usuario: 1,
        estado: 'PENDIENTE' as EstadoPedido,
        total: this.totalCalculado(),
        detalles: detallesPayload
      };

      this.pedidoService.crearPedido(payload).subscribe({
        next: (nuevoPedido) => {
          this.pedidoActual.set(nuevoPedido);
          console.log('Pedido creado correctamente');
        },
        error: (err) => console.error('Error al crear pedido:', err)
      });
    }
  }

  cerrarMesa(): void {
    const pedido = this.pedidoActual();
    if (!pedido) return;

    if (confirm(`¿Desea cerrar la comanda y pasar a cobro de la Mesa ${this.numeroMesa()}?`)) {
      this.pedidoService.actualaizarEstadoOParcial(pedido.id_pedido, { estado: 'CERRADO' }).subscribe({
        next: () => {
          this.limpiarPanel();
          this.cerrarPanel();
        },
        error: (err) => console.error('Error al cerrar mesa:', err)
      });
    }
  }
}