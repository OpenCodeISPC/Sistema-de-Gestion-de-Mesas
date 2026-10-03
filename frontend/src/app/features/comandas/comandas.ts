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
    const sectorActual = this.sectorActivo();

    return this.comandas()
      .map(pedido => {
        // 1. Filtramos los productos INTERNOS de la comanda
        const detallesDelSector = (pedido.detalles || []).filter((detalle: any) => {
          const categoriaProd = detalle.producto?.categoria;
          return categoriaProd && String(categoriaProd).toUpperCase() === sectorActual;
        });

        // 2. Retornamos una copia de la comanda pero SOLO con los detalles que le tocan a esta vista
        return { ...pedido, detalles: detallesDelSector };
      })
      // 3. Finalmente, descartamos las comandas que se quedaron vacías para este sector (ej: si en Cocina solo pidieron bebidas)
      .filter(pedido => pedido.detalles.length > 0);
  });

  estadoDelSector(pedido: any): string {
    return this.sectorActivo() === 'COCINA' ? pedido.estado_cocina : pedido.estado_barra
  }

  pedidosPendientes = computed(() => {
    return this.comandasPorSector().filter(c => this.estadoDelSector(c) === 'PENDIENTE');
  });

  pedidosEnPreparacion = computed(() => {
    return this.comandasPorSector().filter(c => this.estadoDelSector(c) === 'PREPARACION');
  });

  pedidosListos = computed(() => {
    return this.comandasPorSector().filter(c => this.estadoDelSector(c) === 'LISTO');
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
          }).filter(c => {
            const cocinaActiva = ['PENDIENTE', 'PREPARACION', 'LISTO'].includes(c.estado_cocina as string);
            const barraActiva = ['PENDIENTE', 'PREPARACION', 'LISTO'].includes(c.estado_barra as string);
            return cocinaActiva || barraActiva;
          })
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

        const comandasProcesadas = data.map((c: any) => ({
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
    const estadoActual = this.estadoDelSector(comanda)
    let nuevoEstado: EstadoComanda;

    if (estadoActual === 'PENDIENTE') nuevoEstado = 'PREPARACION';
    else if (estadoActual === 'PREPARACION') nuevoEstado = 'LISTO';
    else return;

    this.actualizarEstado(comanda, nuevoEstado);
  }

  retrocederEstado(comanda: IComanda): void {
    const estadoActual = this.estadoDelSector(comanda)
    let nuevoEstado: EstadoComanda;

    if (estadoActual === 'LISTO') nuevoEstado = 'PREPARACION';
    else if (estadoActual === 'PREPARACION') nuevoEstado = 'PENDIENTE';
    else return;

    this.actualizarEstado(comanda, nuevoEstado);
  }

  private actualizarEstado(comanda: IComanda, nuevoEstado: EstadoComanda): void {
    const idTarget = comanda.id_comanda || (comanda as any).id_pedido;
    if (!idTarget) return;

    //Detectar que campo de la base hay que actulizar
    const campoEstado = this.sectorActivo() === 'COCINA' ? 'estado_cocina' : 'estado_barra'
    const payload = { [campoEstado]: nuevoEstado }

    // Actualización optimista de la UI
    this.comandas.update(lista =>
      lista.map(c => {
        if ((c.id_comanda || (c as any).id_pedido) === idTarget) {
          return { ...c, [campoEstado]: nuevoEstado };
        }
        return c;
      })
    );

    this.comandaService.actualizarEstado(idTarget, payload).subscribe({
      next: () => { },
      error: (err) => {
        console.error('Error al cambiar el estado de la comanda', err)
        //reversin visual si fall
        this.comandas.update(lista =>
          lista.map(c => {
            if ((c.id_comanda || (c as any).id_pedido) === idTarget) {
              return { ...c, [campoEstado]: this.estadoDelSector(comanda) }
            }
            return c
          })
        )
        this.errorMensaje.set('Hubo un error al Mover la comanda')
      }
    })
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