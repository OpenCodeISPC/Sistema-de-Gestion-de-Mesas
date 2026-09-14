import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CajaService } from '../../services/caja.service';
import { PedidoService } from '../../services/pedido.service';
import { MesaService } from '../../services/mesa.service';
import { IPago, MetodoPago, ICrearPagoDTO } from '../../models/icaja';
import { IPedido, EstadoPedido } from '../../models/ipedido';
import { IMesa } from '../../models/imesa';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './caja.html',
  styleUrl: './caja.css',
})
export class Caja implements OnInit {
  private cajaService = inject(CajaService);
  private pedidoService = inject(PedidoService);
  private mesaService = inject(MesaService);

  // Signals inicializadas vacías para recibir datos del backend
  pagos = signal<IPago[]>([]);
  pedidos = signal<IPedido[]>([]);
  mesas = signal<IMesa[]>([]);
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  // Signal con el pedido seleccionado en el panel de detalle
  pedidoSeleccionado = signal<IPedido | null>(null);
  metodoPagoActivo = signal<MetodoPago>('EFECTIVO');
  importeRecibido = signal<string>('');

  cobrando = signal<boolean>(false);
  cobroExitoso = signal<boolean>(false);

  // Pedidos que aún no fueron cobrados (estado LISTO o ENTREGADO)
  mesasPorCobrar = computed(() => {
    return this.pedidos().filter(p => p.estado === 'LISTO' || p.estado === 'ENTREGADO');
  });

  // 1. Tarjeta: Pendientes de cobro
  pendientesCount = computed(() => this.mesasPorCobrar().length);

  // 2. Tarjeta: Cobros del turno (sumatoria de los montos registrados)
  totalCobrado = computed(() => {
    return this.pagos().reduce((acc, p) => acc + Number(p.monto), 0);
  });

  // 3. Tarjeta: Mesas liberadas (cobros registrados en el turno)
  mesasLiberadas = computed(() => this.pagos().length);

  // Detalle: Propina sugerida (10% del total del pedido)
  propinaSugerida = computed(() => {
    const pedido = this.pedidoSeleccionado();
    return pedido ? Number(pedido.total) * 0.1 : 0;
  });

  // Detalle: Total a cobrar (total del pedido + propina)
  totalACobrar = computed(() => {
    const pedido = this.pedidoSeleccionado();
    return pedido ? Number(pedido.total) + this.propinaSugerida() : 0;
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.cajaService.getPagos().subscribe({
      next: (pagos) => {
        this.pagos.set(pagos);
        this.cargarPedidos();
      },
      error: () => {
        this.errorMensaje.set('No se pudieron cargar los cobros');
        this.cargando.set(false);
      }
    });
  }

  private cargarPedidos(): void {
    this.pedidoService.getPedidos().subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.cargarMesas();
      },
      error: () => {
        this.errorMensaje.set('No se pudieron cargar los pedidos');
        this.cargando.set(false);
      }
    });
  }

  private cargarMesas(): void {
    this.mesaService.getMesas().subscribe({
      next: (mesas) => {
        this.mesas.set(mesas);
        this.cargando.set(false);

        const pendientes = this.mesasPorCobrar();
        if (pendientes.length > 0 && !this.pedidoSeleccionado()) {
          this.seleccionarPedido(pendientes[0]);
        }
      },
      error: () => {
        this.errorMensaje.set('No se pudieron cargar las mesas');
        this.cargando.set(false);
      }
    });
  }

  // Devuelve el número real de la mesa a partir del ID que envía el pedido
  numeroDeMesa(idMesa: number): number {
    const mesa = this.mesas().find(m => m.id_mesa === idMesa);
    return mesa ? mesa.numero : idMesa;
  }

  // Selecciona el pedido que se visualiza en el panel de detalle
  seleccionarPedido(pedido: IPedido): void {
    this.pedidoSeleccionado.set(pedido);
    this.importeRecibido.set('');
    this.cobroExitoso.set(false);
    this.errorMensaje.set(null);
  }

  cambiarMetodoPago(metodo: MetodoPago): void {
    this.metodoPagoActivo.set(metodo);
  }

  // Formatea un número al estilo argentino (ej: $118.800)
  formatearMoneda(valor: number): string {
    return `$${valor.toLocaleString('es-AR')}`;
  }

  // Convierte a número los decimales que envía Django como string
  aNumero(valor: string | number): number {
    return Number(valor);
  }

  // Devuelve la clase de estado que usa la barra de colores de la fila
  claseEstadoPedido(estado: EstadoPedido): string {
    const clases: Record<EstadoPedido, string> = {
      PENDIENTE: 'sgmb-state--pending',
      PREPARACION: 'sgmb-state--preparing',
      LISTO: 'sgmb-state--ready',
      ENTREGADO: 'sgmb-state--ready',
      CERRADO: 'sgmb-state--paid',
      CANCELADO: 'sgmb-state--preparing',
    };
    return clases[estado] ?? 'sgmb-state--pending';
  }

  // Registra el cobro: el backend cierra el pedido y libera la mesa
  confirmarCobro(): void {
    const pedido = this.pedidoSeleccionado();
    if (!pedido || this.cobrando()) return;

    const dto: ICrearPagoDTO = {
      pedido: pedido.id_pedido,
      metodo_pago: this.metodoPagoActivo(),
      monto: this.totalACobrar(),
      propina: this.propinaSugerida(),
      importe_recibido: this.importeRecibido()
        ? Number(this.importeRecibido())
        : this.totalACobrar(),
    };

    this.cobrando.set(true);
    this.errorMensaje.set(null);

    this.cajaService.crearPago(dto).subscribe({
      next: (nuevoPago) => {
        // Añade el cobro al historial y quita el pedido de la lista de pendientes
        this.pagos.update(lista => [nuevoPago, ...lista]);
        this.pedidos.update(lista => lista.filter(p => p.id_pedido !== pedido.id_pedido));
        this.cobrando.set(false);

        const restantes = this.mesasPorCobrar();
        if (restantes.length > 0) {
          this.seleccionarPedido(restantes[0]);
        } else {
          this.pedidoSeleccionado.set(null);
          this.cobroExitoso.set(true);
        }
      },
      error: () => {
        this.errorMensaje.set('No se pudo registrar el cobro');
        this.cobrando.set(false);
      }
    });
  }
}