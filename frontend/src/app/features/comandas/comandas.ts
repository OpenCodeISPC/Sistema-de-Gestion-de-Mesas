import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from "@angular/router";
import { ComandaService } from '../../services/comandas.service'; 
import { WebsocketService } from '../../services/websocket.service';
import { IPedido, EstadoPedido } from '../../models/ipedido';

// Mantenemos el Sector aquí para el switch de la vista (Cocina / Barra)
export type SectorComanda = 'COCINA' | 'BARRA';

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

  // Signals reactivas usando IPedido directamente
  pedidos = signal<IPedido[]>([]);
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  sectorActivo = signal<SectorComanda>('COCINA');
  ahora = signal<number>(Date.now());
  private intervalId: any;

  // 1. Filtramos por sector
  // NOTA: Asumimos que el backend envía una propiedad 'sector' en el JSON, 
  // si no lo hace, este filtro deberá ajustarse.
  pedidosPorSector = computed(() => {
    return this.pedidos().filter(p => (p as any).sector === this.sectorActivo());
  });

  // 2. Filtramos por Estados de IPedido
  pedidosPendientes = computed(() => {
    return this.pedidosPorSector().filter(p => p.estado === 'PENDIENTE');
  });

  pedidosEnPreparacion = computed(() => {
    return this.pedidosPorSector().filter(p => p.estado === 'PREPARACION');
  });

  pedidosListos = computed(() => {
    return this.pedidosPorSector().filter(p => p.estado === 'LISTO');
  });

  constructor() {
    effect(() => {
      const evento = this.wsService.ultimoEvento();
      if (!evento) return;

      console.log('Evento recibido por WebSocket:', evento);

      const pedidoRecibido = evento.data as IPedido;
      if (!pedidoRecibido || !pedidoRecibido.id_pedido) return;

      if (evento.type === 'PEDIDO_CREADO') {
        this.pedidos.update(lista => {
          const existe = lista.some(p => p.id_pedido === pedidoRecibido.id_pedido);
          if (existe) return lista;
          return [pedidoRecibido, ...lista];
        });
      } 
      else if (evento.type === 'PEDIDO_ESTADO_CAMBIADO') {
        this.pedidos.update(lista => 
          lista.map(p => p.id_pedido === pedidoRecibido.id_pedido ? { ...p, ...pedidoRecibido } : p)
        );
      }
    });
  }

  ngOnInit(): void {
    this.cargarPedidos();
    this.wsService.conectar();
    this.intervalId = setInterval(() => this.ahora.set(Date.now()), 30000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  cargarPedidos(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.comandaService.getComandas().subscribe({
      next: (response: any) => {
        const data = Array.isArray(response) ? response : (response.results || []);
        
        // Ya no necesitamos normalizar IDs, confiamos en IPedido
        const pedidosProcesados: IPedido[] = data.map((p: any) => ({
          ...p,
          detalles: p.detalles || []
        }));

        this.pedidos.set(pedidosProcesados);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar pedidos:', err);
        this.errorMensaje.set('No se pudieron cargar los pedidos');
        this.cargando.set(false);
      }
    });
  }

  cambiarSector(sector: SectorComanda): void {
    this.sectorActivo.set(sector);
  }

  avanzarEstado(pedido: IPedido): void {
    let nuevoEstado: EstadoPedido;
    if (pedido.estado === 'PENDIENTE') nuevoEstado = 'PREPARACION';
    else if (pedido.estado === 'PREPARACION') nuevoEstado = 'LISTO';
    else return;

    this.actualizarEstado(pedido, nuevoEstado);
  }

  retrocederEstado(pedido: IPedido): void {
    let nuevoEstado: EstadoPedido;
    if (pedido.estado === 'LISTO') nuevoEstado = 'PREPARACION';
    else if (pedido.estado === 'PREPARACION') nuevoEstado = 'PENDIENTE';
    else return;

    this.actualizarEstado(pedido, nuevoEstado);
  }

  private actualizarEstado(pedido: IPedido, nuevoEstado: EstadoPedido): void {
    // Actualización optimista de la Signal
    this.pedidos.update(lista => 
      lista.map(p => p.id_pedido === pedido.id_pedido ? { ...p, estado: nuevoEstado } : p)
    );

    // Acá le pasamos el ID del pedido y el DTO parcial ({ estado: nuevoEstado })
    this.comandaService.actualizarEstado(pedido.id_pedido, { estado: nuevoEstado }).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Error al cambiar el estado del pedido', err);
        // Reversión si falla la API
        this.pedidos.update(lista => 
          lista.map(p => p.id_pedido === pedido.id_pedido ? { ...p, estado: pedido.estado } : p)
        );
        this.errorMensaje.set('Hubo un error al mover el pedido');
      }
    });
  }

  calcularTiempoTranscurrido(fechaHora?: string): string {
    if (!fechaHora) return '0 min';

    const tiempoActual = this.ahora();
    const inicio = new Date(fechaHora).getTime();
    const diferenciaMinutos = Math.floor((tiempoActual - inicio) / (1000 * 60));

    if (diferenciaMinutos < 1) return 'Hace un momento';
    if (diferenciaMinutos < 60) return `${diferenciaMinutos} min`;

    const horas = Math.floor(diferenciaMinutos / 60);
    const minsRestantes = diferenciaMinutos % 60;
    return `${horas}h ${minsRestantes}m`;
  }
}