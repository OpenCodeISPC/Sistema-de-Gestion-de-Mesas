import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from "@angular/router";
import { ComandaService } from '../../services/comandas.service';
import { WebsocketService } from '../../services/websocket.service';
import { IComanda, EstadoComanda, SectorComanda } from '../../models/icomandas';

@Component({
  selector: 'app-comandas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './comandas.html',
  styleUrl: './comandas.css',
})
export class Comandas implements OnInit, OnDestroy {
  private comandaService = inject(ComandaService);
  private wsService = inject(WebsocketService);

  // Signals reactivas de estado
  comandas = signal<IComanda[]>([]);
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  sectorActivo = signal<SectorComanda>('COCINA');
  ahora = signal<number>(Date.now());
  private intervalId: any;

  // Computed Signals para filtrado derivado automático
  comandasPorSector = computed(() => {
    return this.comandas().filter(c => c.sector === this.sectorActivo());
  });

  comandasPendientes = computed(() => {
    return this.comandasPorSector().filter(c => c.estado === 'PENDIENTE');
  });

  comandasEnPreparacion = computed(() => {
    return this.comandasPorSector().filter(c => c.estado === 'PREPARACION');
  });

  comandasListas = computed(() => {
    return this.comandasPorSector().filter(c => c.estado === 'LISTO');
  });

  constructor() {
    //  REACTIVIDAD DE ANGULAR 20 CON WEBSOCKETS:
    // El effect() rastrea la Signal wsService.ultimoEvento() y se ejecuta automáticamente
    effect(() => {
      const evento = this.wsService.ultimoEvento();
      if (!evento) return;

      console.log(' Evento recibido por WebSocket:', evento);

      const comandaRecibida = evento.data as IComanda;
      // Normalización de propiedades entre backend Django y frontend Angular
      const idComandaNormalizado = comandaRecibida.id_comanda || (comandaRecibida as any).id_pedido;

      if (!idComandaNormalizado) return;

      if (evento.type === 'PEDIDO_CREADO') {
        this.comandas.update(lista => {
          const existe = lista.some(c => (c.id_comanda || (c as any).id_pedido) === idComandaNormalizado);
          if (existe) return lista;
          return [{ ...comandaRecibida, id_comanda: idComandaNormalizado }, ...lista];
        });
      }
      else if (evento.type === 'PEDIDO_ESTADO_CAMBIADO') {
        this.comandas.update(lista =>
          lista.map(c => {
            const actualId = c.id_comanda || (c as any).id_pedido;
            return actualId === idComandaNormalizado
              ? { ...c, ...comandaRecibida, id_comanda: idComandaNormalizado }
              : c;
          })
        );
      }
    });
  }

  ngOnInit(): void {
    // 1. Cargar comandas iniciales mediante HTTP
    this.cargarComandas();

    // 2. Conectar al WebSocket
    this.wsService.conectar();

    // 3. Temporizador para actualizar contadores
    this.intervalId = setInterval(() => {
      this.ahora.set(Date.now());
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  cargarComandas(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.comandaService.getComandas().subscribe({
      next: (response: any) => {
        const data = Array.isArray(response) ? response : (response.results || []);

        const comandasProcesadas = data.map((c: any) => ({
          ...c,
          id_comanda: c.id_comanda || c.id_pedido, // Mapea id_pedido si viene de la app pedidos
          detalles: c.detalles || c.items || []
        }));

        this.comandas.set(comandasProcesadas);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar comandas:', err);
        this.errorMensaje.set('No se pudieron cargar las comandas');
        this.cargando.set(false);
      }
    });
  }

  cambiarSector(sector: SectorComanda): void {
    this.sectorActivo.set(sector);
  }

  avanzarEstado(comanda: IComanda): void {
    let nuevoEstado: EstadoComanda;
    if (comanda.estado === 'PENDIENTE') nuevoEstado = 'PREPARACION';
    else if (comanda.estado === 'PREPARACION') nuevoEstado = 'LISTO';
    else return;

    this.actualizarEstado(comanda, nuevoEstado);
  }

  retrocederEstado(comanda: IComanda): void {
    let nuevoEstado: EstadoComanda;
    if (comanda.estado === 'LISTO') nuevoEstado = 'PREPARACION';
    else if (comanda.estado === 'PREPARACION') nuevoEstado = 'PENDIENTE';
    else return;

    this.actualizarEstado(comanda, nuevoEstado);
  }

  private actualizarEstado(comanda: IComanda, nuevoEstado: EstadoComanda): void {
    const idTarget = comanda.id_comanda || (comanda as any).id_pedido;
    if (!idTarget) return;

    // Actualización optimista de la Signal
    this.comandas.update(lista =>
      lista.map(c => ((c.id_comanda || (c as any).id_pedido) === idTarget) ? { ...c, estado: nuevoEstado } : c)
    );

    this.comandaService.actualizarEstado(idTarget, { estado: nuevoEstado }).subscribe({
      next: () => { },
      error: (err) => {
        console.error('Error al cambiar el estado de la comanda', err);
        // Reversión si falla la API
        this.comandas.update(lista =>
          lista.map(c => ((c.id_comanda || (c as any).id_pedido) === idTarget) ? { ...c, estado: comanda.estado } : c)
        );
        this.errorMensaje.set('Hubo un error al mover la comanda');
      }
    });
  }

  calcularTiempoTranscurrido(creadoEn?: string): string {
    if (!creadoEn) return '0 min';

    const tiempoActual = this.ahora();
    const inicio = new Date(creadoEn).getTime();
    const diferenciaMinutos = Math.floor((tiempoActual - inicio) / (1000 * 60));

    if (diferenciaMinutos < 1) return 'Hace un momento';
    if (diferenciaMinutos < 60) return `${diferenciaMinutos} min`;

    const horas = Math.floor(diferenciaMinutos / 60);
    const minsRestantes = diferenciaMinutos % 60;
    return `${horas}h ${minsRestantes}m`;
  }
}  