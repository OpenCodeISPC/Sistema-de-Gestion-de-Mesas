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

  comandas = signal<IComanda[]>([]);
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  sectorActivo = signal<SectorComanda>('COCINA');
  ahora = signal<number>(Date.now());
  private intervalId: any;

  comandasPorSector = computed(() => {
    // Si el backend no provee sector, asumimos 'COCINA' por defecto para que no desaparezcan
    return this.comandas().filter(c => (c.sector || 'COCINA') === this.sectorActivo());
  });

  pedidosPendientes = computed(() => {
    return this.comandasPorSector().filter(c => c.estado === 'PENDIENTE');
  });

  pedidosEnPreparacion = computed(() => {
    return this.comandasPorSector().filter(c => c.estado === 'PREPARACION');
  });

  pedidosListos = computed(() => {
    return this.comandasPorSector().filter(c => c.estado === 'LISTO');
  });

  constructor() {
    effect(() => {
      const evento = this.wsService.ultimoEvento();
      if (!evento) return;

      const comandaRecibida = evento.data as any; // Recibimos el payload crudo de Django
      const idComandaNormalizado = comandaRecibida.id_comanda || comandaRecibida.id_pedido;

      if (!idComandaNormalizado) return;

      // Normalizamos el objeto para asegurar compatibilidad con la interfaz
      const comandaLimpia: IComanda = {
        ...comandaRecibida,
        id_comanda: idComandaNormalizado,
        sector: comandaRecibida.sector || 'COCINA',
        detalles: comandaRecibida.detalles || comandaRecibida.items || []
      };

      if (evento.type === 'PEDIDO_CREADO') {
        this.comandas.update(lista => {
          const existe = lista.some(c => (c.id_comanda || (c as any).id_pedido) === idComandaNormalizado);
          if (existe) return lista;
          return [comandaLimpia, ...lista];
        });
      }
      else if (evento.type === 'PEDIDO_ESTADO_CAMBIADO') {
        this.comandas.update(lista =>
          lista.map(c => {
            const actualId = c.id_comanda || (c as any).id_pedido;
            return actualId === idComandaNormalizado
              ? { ...c, ...comandaLimpia, id_comanda: idComandaNormalizado }
              : c;
          }).filter(c => ['PENDIENTE', 'PREPARACION', 'LISTO'].includes(c.estado as string)) // Remueve la comanda si pasa a CERRADO
        );
      }
    });
  }

  ngOnInit(): void {
    this.cargarComandas();
    this.wsService.conectar();

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

        const comandasProcesadas = data
          .filter((c: any) => ['PENDIENTE', 'PREPARACION', 'LISTO'].includes(c.estado)) // Filtra las ya entregadas/cerradas
          .map((c: any) => ({
            ...c,
            id_comanda: c.id_comanda || c.id_pedido,
            sector: c.sector || 'COCINA',
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

    // Actualización optimista de la UI
    this.comandas.update(lista =>
      lista.map(c => ((c.id_comanda || (c as any).id_pedido) === idTarget) ? { ...c, estado: nuevoEstado } : c)
    );

    this.comandaService.actualizarEstado(idTarget, { estado: nuevoEstado }).subscribe({
      next: () => { },
      error: (err) => {
        console.error('Error al cambiar el estado de la comanda', err);
        // Reversión visual si falla el backend
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