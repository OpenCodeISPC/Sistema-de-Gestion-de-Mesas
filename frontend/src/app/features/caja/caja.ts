import { Component, OnInit, inject, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CajaService } from '../../services/caja.service';
import { PedidoService } from '../../services/pedido.service';
import { MesaService } from '../../services/mesa.service';
import { WebsocketService } from '../../services/websocket.service';
import { IPago, MetodoPago, ICrearPagoDTO, ICierreCaja, ICierreResumen, ICerrarCajaDTO } from '../../models/icaja';
import { IPedido, EstadoPedido } from '../../models/ipedido';
import { IMesa } from '../../models/imesa';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './caja.html',
  styleUrl: './caja.css',
})
export class Caja implements OnInit {
  private cajaService = inject(CajaService);
  private pedidoService = inject(PedidoService);
  private mesaService = inject(MesaService);
  private wsService = inject(WebsocketService);

  // Signals inicializadas vacías para recibir datos del backend
  pagos = signal<IPago[]>([]);
  pedidos = signal<IPedido[]>([]);
  mesas = signal<IMesa[]>([]);
  cargando = signal<boolean>(false);
  errorCobros = signal<string | null>(null);
  errorCierre = signal<string | null>(null);

  // Signal con el pedido seleccionado en el panel de detalle
  pedidoSeleccionado = signal<IPedido | null>(null);
  metodoPagoActivo = signal<MetodoPago>('EFECTIVO');
  importeRecibido = signal<string>('');
  // El camarero marca si la mesa dejó propina (10%) al cobrar
  incluirPropina = signal<boolean>(false);

  cobrando = signal<boolean>(false);
  cobroExitoso = signal<boolean>(false);
  generandoFactura = signal<boolean>(false);

  // Tab activo del módulo caja
  tabActivo = signal<'cobros' | 'cierre'>('cobros');

  // ---- Estado para el Cierre de caja ----
  resumenCaja = signal<ICierreResumen | null>(null);
  cierreHistorial = signal<ICierreCaja[]>([]);
  totalRendido = signal<string>('');
  observaciones = signal<string>('');
  cerrando = signal<boolean>(false);
  reabriendo = signal<boolean>(false);
  cierreExitoso = signal<boolean>(false);

  // Diferencia estimada: monto rendido vs efectivo esperado
  diferenciaPreview = computed(() => {
    const rendido = Number(this.totalRendido());
    const efectivoEsperado = this.resumenCaja()?.monto_efectivo ?? 0;
    return (Number.isNaN(rendido) ? 0 : rendido) - efectivoEsperado;
  });

  // La caja del día ya fue cerrada: no se pueden registrar más cobros
  cajaCerrada = computed(() => this.resumenCaja()?.cerrado === true);

  // Pedidos activos de las mesas: aún no cobrados (pendiente, preparación, listo o entregado)
  mesasPorCobrar = computed(() => {
    const estadosActivos: EstadoPedido[] = ['PENDIENTE', 'PREPARACION', 'LISTO', 'ENTREGADO'];
    return this.pedidos().filter(p => estadosActivos.includes(p.estado));
  });

  // Un pedido solo se puede cobrar cuando ya está LISTO o ENTREGADO
  puedeCobrar(pedido: IPedido | null): boolean {
    return !!pedido && (pedido.estado === 'LISTO' || pedido.estado === 'ENTREGADO');
  }

  // ¿El pedido seleccionado está en condiciones de cobrarse?
  puedeCobrarSeleccionado = computed(() => this.puedeCobrar(this.pedidoSeleccionado()));

  // 1. Tarjeta: Pendientes de cobro
  pendientesCount = computed(() => this.mesasPorCobrar().length);

  // Inicio del turno actual: la medianoche local o, si la caja de hoy ya fue
  // cerrada, el momento del cierre (así los cobros no se acumulan de un turno a otro)
  private inicioTurno = computed<number>(() => {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const cierreHora = this.resumenCaja()?.cierre?.fecha_hora;
    if (cierreHora) {
      const fechaCierre = new Date(cierreHora).getTime();
      if (!Number.isNaN(fechaCierre) && fechaCierre > inicioHoy.getTime()) {
        return fechaCierre;
      }
    }
    return inicioHoy.getTime();
  });

  // Cobros que pertenecen al turno actual (no acumula días/turnos anteriores)
  pagosTurno = computed(() => {
    const desde = this.inicioTurno();
    return this.pagos().filter((p) => new Date(p.fecha_hora).getTime() >= desde);
  });

  // 2. Tarjeta: Cobros del turno (sumatoria de los montos del turno actual)
  totalCobrado = computed(() => {
    return this.pagosTurno().reduce((acc, p) => acc + Number(p.monto), 0);
  });

  // 3. Tarjeta: Mesas liberadas (cobros registrados en el turno actual)
  mesasLiberadas = computed(() => this.pagosTurno().length);

  // Detalle: Propina sugerida (10% del total del pedido)
  propinaSugerida = computed(() => {
    const pedido = this.pedidoSeleccionado();
    return pedido ? Number(pedido.total) * 0.1 : 0;
  });

  // Propina que efectivamente se cobra según la marca del camarero
  propinaAplicada = computed(() => (this.incluirPropina() ? this.propinaSugerida() : 0));

  // Detalle: Total a cobrar (total del pedido + propina aplicada)
  totalACobrar = computed(() => {
    const pedido = this.pedidoSeleccionado();
    return pedido ? Number(pedido.total) + this.propinaAplicada() : 0;
  });

  constructor() {
    // Escucha en tiempo real las altas/ediciones de pedidos que envía el backend
    // para reflejarlas en "Mesas por cobrar" sin recargar la página.
    effect(() => {
      const evento = this.wsService.ultimoEvento();
      if (!evento) return;

      untracked(() => {
        if (evento.type !== 'PEDIDO_CREADO' && evento.type !== 'PEDIDO_ESTADO_CAMBIADO') return;

        const pedidoRecibido = evento.data as IPedido;
        if (!pedidoRecibido || !pedidoRecibido.id_pedido) return;

        this.pedidos.update(lista => {
          const existe = lista.some(p => p.id_pedido === pedidoRecibido.id_pedido);
          if (existe) {
            return lista.map(p =>
              p.id_pedido === pedidoRecibido.id_pedido ? { ...p, ...pedidoRecibido } : p
            );
          }
          return [pedidoRecibido, ...lista];
        });

        // Mantiene actualizado (o limpia) el detalle si el pedido afectado estaba seleccionado
        const seleccionado = this.pedidoSeleccionado();
        if (seleccionado && seleccionado.id_pedido === pedidoRecibido.id_pedido) {
          const inactivo = pedidoRecibido.estado === 'CERRADO' || pedidoRecibido.estado === 'CANCELADO';
          this.pedidoSeleccionado.set(inactivo ? null : pedidoRecibido);
        }
      });
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarCierre();
    this.wsService.conectar();
  }

  cambiarTab(tab: 'cobros' | 'cierre'): void {
    this.tabActivo.set(tab);
    if (tab === 'cierre') {
      this.cargarCierre();
    }
  }

  cargarCierre(): void {
    this.cajaService.getResumenCaja().subscribe({
      next: (resumen) => {
        this.resumenCaja.set(resumen);
      },
      error: () => {
        this.errorCierre.set('No se pudo cargar el estado de caja');
      }
    });

    this.cajaService.getCierres().subscribe({
      next: (cierres) => {
        this.cierreHistorial.set(cierres);
      },
      error: () => {
        this.errorCierre.set('No se pudieron cargar los cierres');
      }
    });
  }

  confirmarCierre(): void {
    if (this.cerrando()) return;

    const totalRendido = Number(this.totalRendido());
    if (Number.isNaN(totalRendido) || totalRendido < 0) {
      this.errorCierre.set('Ingresá un monto rendido válido.');
      return;
    }

    const dto: ICerrarCajaDTO = {
      total_rendido: totalRendido,
      observaciones: this.observaciones() || null,
    };

    this.cerrando.set(true);
    this.errorCierre.set(null);

    this.cajaService.crearCierre(dto).subscribe({
      next: (cierre) => {
        this.resumenCaja.update((r) => r ? { ...r, cerrado: true, cierre } : r);
        this.cierreHistorial.update((lista) => [cierre, ...lista]);
        this.cerrando.set(false);
        this.cierreExitoso.set(true);
      },
      error: (err) => {
        this.errorCierre.set(this.mensajeDeError(err, 'No se pudo registrar el cierre de caja.'));
        this.cerrando.set(false);
      }
    });
  }

  reabrirCaja(): void {
    if (this.reabriendo()) return;

    const fechaCerrada = this.resumenCaja()?.cierre?.fecha_cierre;
    this.reabriendo.set(true);
    this.errorCierre.set(null);

    this.cajaService.reabrirCaja().subscribe({
      next: () => {
        // Quita el estado cerrado y refresca el resumen sin el cierre de hoy
        this.resumenCaja.update((r) => r ? { ...r, cerrado: false, cierre: null } : r);
        if (fechaCerrada) {
          this.cierreHistorial.update((lista) =>
            lista.filter((c) => c.fecha_cierre !== fechaCerrada)
          );
        }
        this.reabriendo.set(false);
        this.cierreExitoso.set(false);
      },
      error: (err) => {
        this.errorCierre.set(this.mensajeDeError(err, 'No se pudo reabrir la caja.'));
        this.reabriendo.set(false);
      }
    });
  }

  claseDiferencia(valor: number): string {
    return valor >= 0 ? 'sgmb-dif--positiva' : 'sgmb-dif--negativa';
  }

  formatearFechaHora(iso: string): string {
    if (!iso) return '';
    const fecha = new Date(iso);
    if (isNaN(fecha.getTime())) return iso;
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${minuto}`;
  }

  formatearFecha(iso: string): string {
    if (!iso) return '';
    const soloFecha = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (soloFecha) {
      return `${soloFecha[3]}/${soloFecha[2]}/${soloFecha[1]}`;
    }
    const fecha = new Date(iso);
    if (isNaN(fecha.getTime())) return iso;
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${fecha.getFullYear()}`;
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.errorCobros.set(null);

    this.cajaService.getPagosDelDia(this.fechaDeHoy()).subscribe({
      next: (pagos) => {
        this.pagos.set(pagos);
        this.cargarPedidos();
      },
      error: () => {
        this.errorCobros.set('No se pudieron cargar los cobros');
        this.cargando.set(false);
      }
    });
  }

  // Fecha local de hoy en formato YYYY-MM-DD
  private fechaDeHoy(): string {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${hoy.getFullYear()}-${mes}-${dia}`;
  }

  private cargarPedidos(): void {
    this.pedidoService.getPedidos().subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.cargarMesas();
      },
      error: () => {
        this.errorCobros.set('No se pudieron cargar los pedidos');
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
        this.errorCobros.set('No se pudieron cargar las mesas');
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
    this.incluirPropina.set(false);
    this.cobroExitoso.set(false);
    this.errorCobros.set(null);
  }

  cambiarMetodoPago(metodo: MetodoPago): void {
    this.metodoPagoActivo.set(metodo);
  }

  // Formatea un número al estilo argentino (ej: $118.800)
  formatearMoneda(valor: number | string): string {
    const numero = Number(valor);
    return `$${(Number.isNaN(numero) ? 0 : numero).toLocaleString('es-AR')}`;
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

  // Nombre legible del estado para mostrar en la UI
  etiquetaEstado(estado: EstadoPedido): string {
    const etiquetas: Record<EstadoPedido, string> = {
      PENDIENTE: 'Pendiente',
      PREPARACION: 'Preparación',
      LISTO: 'Listo',
      ENTREGADO: 'Entregado',
      CERRADO: 'Cerrado',
      CANCELADO: 'Cancelado',
    };
    return etiquetas[estado] ?? estado;
  }

  // Registra el cobro: el backend cierra el pedido y libera la mesa
  confirmarCobro(): void {
    const pedido = this.pedidoSeleccionado();
    if (!pedido || this.cobrando()) return;

    if (this.cajaCerrada()) {
      this.errorCobros.set('La caja de hoy ya está cerrada. No se pueden registrar más cobros.');
      return;
    }

    if (!this.puedeCobrar(pedido)) {
      this.errorCobros.set('La mesa todavía no está lista para cobrar. Esperá a que el pedido esté listo.');
      return;
    }

    const dto: ICrearPagoDTO = {
      pedido: pedido.id_pedido,
      metodo_pago: this.metodoPagoActivo(),
      monto: this.totalACobrar(),
      propina: this.propinaAplicada(),
      importe_recibido: this.importeRecibido()
        ? Number(this.importeRecibido())
        : this.totalACobrar(),
    };

    this.cobrando.set(true);
    this.errorCobros.set(null);

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
      error: (err) => {
        this.errorCobros.set(this.mensajeDeError(err, 'No se pudo registrar el cobro'));
        this.cobrando.set(false);
      }
    });
  }

  // Extrae el detalle que devuelve DRF (lista o dict) para mostrarlo al usuario
  private mensajeDeError(err: any, fallback: string): string {
    const detalle = err?.error;
    if (!detalle) return fallback;
    if (Array.isArray(detalle)) return String(detalle[0] ?? fallback);
    if (detalle.detail) return String(detalle.detail);
    if (typeof detalle === 'string') return detalle;
    const primerCampo = Object.values(detalle)[0];
    if (Array.isArray(primerCampo)) return String(primerCampo[0] ?? fallback);
    return fallback;
  }

  exportarPDF(idCierre: number): void {
    if (!idCierre) return;
    this.cajaService.exportarCierrePdf(idCierre).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cierre-caja-' + idCierre + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Error al exportar PDF', err);
        this.errorCierre.set('No se pudo generar el PDF del cierre.');
      }
    });
  }

  // Descarga la factura (PDF) de la mesa seleccionada, con la propina marcada
  exportarFactura(): void {
    const pedido = this.pedidoSeleccionado();
    if (!pedido || this.generandoFactura()) return;

    this.generandoFactura.set(true);
    this.errorCobros.set(null);

    this.pedidoService.exportarFacturaPdf(pedido.id_pedido, this.propinaAplicada()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-mesa-${this.numeroDeMesa(pedido.mesa)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.generandoFactura.set(false);
      },
      error: (err: any) => {
        console.error('Error al generar la factura', err);
        this.errorCobros.set('No se pudo generar la factura.');
        this.generandoFactura.set(false);
      }
    });
  }
}




