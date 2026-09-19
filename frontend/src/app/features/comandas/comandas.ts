import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from "@angular/router";
import { ComandaService } from '../../services/comandas.service'; 
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

  // Signals para el estado global del componente
  comandas = signal<IComanda[]>([]);
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  // Signal para el filtro de los botones superiores (COCINA / BARRA)
  sectorActivo = signal<SectorComanda>('COCINA');

  // Signal para refrescar los contadores de tiempo en pantalla cada 30 segundos
  ahora = signal<number>(Date.now());
  private intervalId: any;

  // 1. Computed Signal: Filtra las comandas por sector activo
  comandasPorSector = computed(() => {
    return this.comandas().filter(c => c.sector === this.sectorActivo());
  });

  // 2. Computed Signals: Dividen el sector activo en 3 columnas
  comandasPendientes = computed(() => {
    return this.comandasPorSector().filter(c => c.estado === 'PENDIENTE');
  });

  comandasEnPreparacion = computed(() => {
    return this.comandasPorSector().filter(c => c.estado === 'PREPARACION');
  });

  comandasListas = computed(() => {
    return this.comandasPorSector().filter(c => c.estado === 'LISTO');
  });

  ngOnInit(): void {
    this.cargarComandas();

    // Actualiza el timestamp 'ahora' cada 30 segundos para refrescar contadores
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
        // Normaliza respuesta si viene paginada o como lista directa
        const data = Array.isArray(response) ? response : (response.results || []);
        
        // Asegura que detalles no sea undefined
        const comandasProcesadas = data.map((c: IComanda) => ({
          ...c,
          detalles: c.detalles || []
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
    if (!comanda.id_comanda) return;

    // Actualización optimista
    this.comandas.update(lista => 
      lista.map(c => c.id_comanda === comanda.id_comanda ? { ...c, estado: nuevoEstado } : c)
    );

    this.comandaService.actualizarEstado(comanda.id_comanda, { estado: nuevoEstado }).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Error al cambiar el estado de la comanda', err);
        // Reversión
        this.comandas.update(lista => 
          lista.map(c => c.id_comanda === comanda.id_comanda ? { ...c, estado: comanda.estado } : c)
        );
        this.errorMensaje.set('Hubo un error al mover la comanda');
      }
    });
  }

  // Calcula el tiempo transcurrido desde 'creado_en'
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