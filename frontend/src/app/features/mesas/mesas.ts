import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IMesa, EstadoMesa } from '../../models/imesa';
import { MesaService } from '../../services/mesa.service';
import { WebsocketService } from '../../services/websocket.service';
import { Pedidos } from './pedidos/pedidos';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, Pedidos],
  templateUrl: './mesas.html',
  styleUrl: './mesas.css',
})
export class Mesas implements OnInit {
  private readonly mesaService = inject(MesaService);
  private readonly wsService = inject(WebsocketService);

  // --------------------------------------------------------------------------
  // SIGNALS DE ESTADO
  // --------------------------------------------------------------------------
  mesas = signal<IMesa[]>([]);
  mesaSeleccionada = signal<IMesa | null>(null);

  // --------------------------------------------------------------------------
  // SIGNALS COMPUTADAS (Totales para las cards de resumen)
  // --------------------------------------------------------------------------
  totalMesas = computed(() => this.mesas().length);
  
  mesasDisponibles = computed(() => 
    this.mesas().filter(m => m.estado === 'LIBRE').length
  );

  mesasReservadas = computed(() => 
    this.mesas().filter(m => m.estado === 'RESERVADA').length
  );

  mesasOcupadas = computed(() => 
    this.mesas().filter(m => m.estado === 'OCUPADA').length
  );

  // Agrupación por ubicación/sector (ej: "Salón Principal", "Terraza")
  mesasPorSector = computed(() => {
    const mapa = new Map<string, IMesa[]>();
    
    for (const mesa of this.mesas()) {
      const sector = mesa.ubicacion?.trim() || 'Salón Principal';
      if (!mapa.has(sector)) {
        mapa.set(sector, []);
      }
      mapa.get(sector)!.push(mesa);
    }

    return Array.from(mapa.entries()).map(([nombreSector, listaMesas]) => ({
      nombreSector,
      mesas: listaMesas
    }));
  });

  constructor() {
    // Suscripción a eventos de cambio de estado de mesas por WebSockets
    effect(() => {
      const evento = this.wsService.ultimoEvento();
      if (!evento) return;

      if (evento.type === 'MESA_CAMBIO_ESTADO' && evento.data) {
        const mesaActualizada: IMesa = evento.data;
        this.actualizarMesaEnLista(mesaActualizada);
      }
    });
  }

  ngOnInit(): void {
    this.cargarMesas();
  }

  // --------------------------------------------------------------------------
  // CARGA Y ACTUALIZACIÓN DE DATOS
  // --------------------------------------------------------------------------
  cargarMesas(): void {
    this.mesaService.getMesas().subscribe({
      next: (data) => this.mesas.set(data),
      error: (err) => console.error('Error al cargar mesas:', err)
    });
  }

  private actualizarMesaEnLista(mesaActualizada: IMesa): void {
    this.mesas.update(lista =>
      lista.map(m => m.id_mesa === mesaActualizada.id_mesa ? mesaActualizada : m)
    );

    // Si la mesa que cambió era la seleccionada actualmente, actualizamos la referencia
    if (this.mesaSeleccionada()?.id_mesa === mesaActualizada.id_mesa) {
      this.mesaSeleccionada.set(mesaActualizada);
    }
  }

  // --------------------------------------------------------------------------
  // INTERACCIONES CON LA INTERFAZ
  // --------------------------------------------------------------------------
  seleccionarMesa(mesa: IMesa): void {
    this.mesaSeleccionada.set(mesa);
  }

  deseleccionarMesa(): void {
    this.mesaSeleccionada.set(null);
  }

  // Helpers para clases dinámicas del CSS según el estado de la mesa
  getCardClass(estado: EstadoMesa): string {
    switch (estado) {
      case 'LIBRE': return 'sgmb-table-card--available';
      case 'OCUPADA': return 'sgmb-table-card--occupied';
      case 'RESERVADA': return 'sgmb-table-card--reserved';
      default: return 'sgmb-table-card--available';
    }
  }

  getBadgeClass(estado: EstadoMesa): string {
    switch (estado) {
      case 'LIBRE': return 'sgmb-status--green';
      case 'OCUPADA': return 'sgmb-status--red';
      case 'RESERVADA': return 'sgmb-status--orange';
      default: return 'sgmb-status--green';
    }
  }

  getIconClass(estado: EstadoMesa): string {
    switch (estado) {
      case 'LIBRE': return 'bi-check-lg';
      case 'OCUPADA': return 'bi-x-lg';
      case 'RESERVADA': return 'bi-calendar-event';
      default: return 'bi-check-lg';
    }
  }
}