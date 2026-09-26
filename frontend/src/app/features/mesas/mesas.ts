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

  marcarMesaComoOcupada(idMesa: number): void {
    this.mesas.update(lista =>
      lista.map(m => m.id_mesa === idMesa ? { ...m, estado: 'OCUPADA' } : m)
    )
    if (this.mesaSeleccionada()?.id_mesa === idMesa) {
      this.mesaSeleccionada.update(m => m ? { ...m, estado: 'OCUPADA' } : null)
    }
    this.mesaService.actualizarMesa(idMesa, { estado: 'OCUPADA' }).subscribe({
      next: () => console.log(`Mesa ${idMesa} marcada como OCUPADA`),
      error: (err) => console.error('Error al actualizar estado de la mesa:', err)
    })
  }

  marcarMesaComoLibre(idMesa: number): void {
    this.mesas.update(lista =>
      lista.map(m => m.id_mesa === idMesa ? { ...m, estado: 'LIBRE' } : m)
    )
    // si la mesa seleccionada es la que se cerro, deseleccionamos el panel lateral
    if (this.mesaSeleccionada()?.id_mesa === idMesa) {
      this.deseleccionarMesa()
    }
    //resguardo por Http al endpoint de mesa
    this.mesaService.actualizarMesa(idMesa, { estado: 'LIBRE' } as any).subscribe({
      next: () => console.log(`Mesa ${idMesa} marcada como LIBRE`),
      error: (err) => console.error('Error al actualizar estado de la mesa:', err)
    })
  }

  // --------------------------------------------------------------------------
  // INTERACCIONES CON LA INTERFAZ
  // --------------------------------------------------------------------------
  seleccionarMesa(mesa: IMesa): void {
    if (mesa.estado === 'RESERVADA') {
      alert(`La Mesa ${mesa.numero} está reservada. Debes cambiar su estado a LIBRE para abrir un pedido`)
      return
    }
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

  // Método para alternar entre RESERVADA y LIBRE
  toggleReservaMesa(mesa: IMesa, event: Event): void {
    event.stopPropagation(); // Evita que se abra el panel al hacer clic en el botón de opciones

    if (mesa.estado === 'OCUPADA') {
      alert('No se puede reservar una mesa que ya está ocupada con un pedido activo.');
      return;
    }

    const nuevoEstado: EstadoMesa = mesa.estado === 'RESERVADA' ? 'LIBRE' : 'RESERVADA';
    const accionText = nuevoEstado === 'RESERVADA' ? 'reservar' : 'liberar';

    if (confirm(`¿Deseas ${accionText} la Mesa ${mesa.numero}?`)) {
      // 1. Actualización optimista de Signals
      this.mesas.update(lista =>
        lista.map(m => m.id_mesa === mesa.id_mesa ? { ...m, estado: nuevoEstado } : m)
      );

      // 2. Construcción del payload completo requerido por el Serializer
      const payload = {
        numero: mesa.numero,
        capacidad: mesa.capacidad,
        estado: nuevoEstado,
        ubicacion: mesa.ubicacion
      };

      // 2. Notificación al backend
      this.mesaService.actualizarMesa(mesa.id_mesa, payload as any).subscribe({
        next: () => console.log(`Mesa ${mesa.numero} actualizada a ${nuevoEstado}`),
        error: (err) => {
          console.error('Error al cambiar el estado de reserva:', err);
          this.cargarMesas(); // Reversión en caso de error
        }
      });
    }
  }
}