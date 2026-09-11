import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
export class Comandas implements OnInit {
  private comandaService = inject(ComandaService);

  // Signal inicializado vacío para recibir datos del backend
  comandas = signal<IComanda[]>([]);
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  // Signal para el filtro de los botones superiores (Cocina / Barra)
  sectorActivo = signal<SectorComanda>('COCINA');

  // 1. Computed Signal: Filtra las comandas solo por el sector activo
  comandasPorSector = computed(() => {
    return this.comandas().filter(c => c.sector === this.sectorActivo());
  });

  // 2. Computed Signals: Dividen las comandas del sector activo en las 3 columnas
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
  }

  cargarComandas(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.comandaService.getComandas().subscribe({
      next: (data) => {
        this.comandas.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.errorMensaje.set('No se pudieron cargar las comandas');
        this.cargando.set(false);
      }
    });
  }
  }
