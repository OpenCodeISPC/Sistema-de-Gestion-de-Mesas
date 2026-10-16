import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IMesa, EstadoMesa } from '../../models/imesa';
import { MesaService } from '../../services/mesa.service';
import { WebsocketService } from '../../services/websocket.service';
import { Pedidos } from './pedidos/pedidos';

import { forkJoin } from 'rxjs';
import { PedidoService } from '../../services/pedido.service';

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
  private readonly pedidoService = inject(PedidoService)

  // --------------------------------------------------------------------------
  // SIGNALS DE ESTADO
  // --------------------------------------------------------------------------
  mesas = signal<IMesa[]>([]);
  mesaSeleccionada = signal<IMesa | null>(null);

  //Nvo para controlar pestañas activas
  pestanaActiva = signal<'MESAS' | 'RESERVAS'>('MESAS')

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

    //1 Filtramos las mesas segun la pestaña activa
    const mesasAMostrar = this.pestanaActiva() === 'RESERVAS'
      ? this.mesas().filter(m => m.estado === 'RESERVADA')
      : this.mesas();//mostramos todo

    for (const mesa of mesasAMostrar) {
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
    effect(() => {
      const evento = this.wsService.ultimoEvento();
      if (!evento) return;

      // 1. Escuchar cambios de estado directos en MESAS
      if (evento.type === 'MESA_CAMBIO_ESTADO' && evento.data) {
        const mesaActualizada: IMesa = evento.data;

        this.mesas.update(lista =>
          lista.map(m => {
            if (m.id_mesa === mesaActualizada.id_mesa) {
              // Si la mesa localmente ya está en 'LISTO' y llega 'OCUPADA', conservamos 'LISTO'
              return m.estado === 'LISTO' && mesaActualizada.estado === 'OCUPADA'
                ? m
                : mesaActualizada;
            }
            return m;
          })
        );
      }

      // 2. Escuchar cambios de estado en PEDIDOS (WebSockets)
      if ((evento.type === 'PEDIDO_ESTADO_CAMBIADO' || evento.type === 'PEDIDO_CREADO') && evento.data) {
        const pedido = evento.data;

        const idMesa = typeof pedido.mesa === 'object'
          ? (pedido.mesa?.id_mesa || pedido.mesa?.id)
          : (pedido.mesa || pedido.mesa_id);

        if (idMesa) {
          const idNum = Number(idMesa);

          if (pedido.estado === 'LISTO') {
            // Cambiamos visualmente el estado de la mesa a 'LISTO'
            this.mesas.update(lista =>
              lista.map(m => m.id_mesa === idNum ? { ...m, estado: 'LISTO' as EstadoMesa } : m)
            );
          } else if (pedido.estado === 'CERRADO' || pedido.estado === 'CANCELADO') {
            // Liberamos la mesa cuando el pedido se cierra o se cancela
            this.mesas.update(lista =>
              lista.map(m => m.id_mesa === idNum ? { ...m, estado: 'LIBRE' as EstadoMesa } : m)
            );
          }
        }
      }
    });
  }

  ngOnInit(): void {
    this.cargarMesas();
  }

  // NUEVO: Método para cambiar de pestaña
  cambiarPestana(pestana: 'MESAS' | 'RESERVAS'): void {
    this.pestanaActiva.set(pestana);
    this.deseleccionarMesa(); // Cerramos el panel lateral si cambian de vista
  }

  // --------------------------------------------------------------------------
  // CARGA Y ACTUALIZACIÓN DE DATOS
  // --------------------------------------------------------------------------
  cargarMesas(): void {
    // Consultamos Mesas y Pedidos en paralelo al cargar la pantalla
    forkJoin({
      mesas: this.mesaService.getMesas(),
      pedidos: this.pedidoService.getPedidos()
    }).subscribe({
      next: ({ mesas, pedidos }) => {
        // Buscamos los IDs de las mesas que tienen un pedido en estado 'LISTO'
        const idsMesasListas = new Set(
          pedidos
            .filter(p => p.estado === 'LISTO')
            .map(p => typeof p.mesa === 'object' ? (p.mesa as any).id_mesa : p.mesa)
        );

        // Decoramos las mesas asignándole 'LISTO' a las correspondientes
        const mesasDecoradas = mesas.map(m => ({
          ...m,
          estado: idsMesasListas.has(m.id_mesa) ? ('LISTO' as EstadoMesa) : m.estado
        }));

        this.mesas.set(mesasDecoradas);
      },
      error: (err) => console.error('Error al cargar mesas y pedidos:', err)
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
      case 'LISTO': return 'sgmb-table-card--blinking';
      default: return 'sgmb-table-card--available';
    }
  }

  getBadgeClass(estado: EstadoMesa): string {
    switch (estado) {
      case 'LIBRE': return 'sgmb-status--green';
      case 'OCUPADA': return 'sgmb-status--red';
      case 'RESERVADA': return 'sgmb-status--orange';
      case 'LISTO': return 'sgmb-status--warning';
      default: return 'sgmb-status--green';
    }
  }

  getIconClass(estado: EstadoMesa): string {
    switch (estado) {
      case 'LIBRE': return 'bi-check-lg';
      case 'OCUPADA': return 'bi-x-lg';
      case 'RESERVADA': return 'bi-calendar-event';
      case 'LISTO': return 'bi-bell-fill';
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

  editarCapacidad(mesa: IMesa, event: Event): void {
    event.stopPropagation()

    // 1. Pedimos la nueva capacidad al usuario
    const input = prompt(
      `Ingrese la nueva capacidad para la Mesa ${mesa.numero}:`,
      mesa.capacidad.toString()
    )

    // 2 Si el usuario no cancelo el prompt
    if (input !== null) {
      const nuevaCapacidad = parseInt(input.trim(), 10)

      if (isNaN(nuevaCapacidad) || nuevaCapacidad <= 0) {
        alert('Por favor ingrese un número válido mayor a 0.')
        return
      }

      // 3 Actualizamos en el backend
      this.mesaService.actualizarMesa(mesa.id_mesa, { capacidad: nuevaCapacidad } as any).subscribe({
        next: () => {
          this.mesas.update(lista =>
            lista.map(m => m.id_mesa === mesa.id_mesa ? { ...m, capacidad: nuevaCapacidad } : m)
          )
          console.log(`Capacidad de Mesa ${mesa.numero} actualizada a ${nuevaCapacidad}`)
        },
        error: (err) => {
          console.error('Error al actualizar la capacidad:', err)
          alert('Ocurrio un error al intentar cambiar la capacidad de la mesa')
        }
      })
    }
  }
}