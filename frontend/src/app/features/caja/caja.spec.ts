import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { Caja } from './caja';
import { IPago } from '../../models/icaja';
import { IPedido } from '../../models/ipedido';

describe('Caja', () => {
  let component: Caja;
  let fixture: ComponentFixture<Caja>;
  let httpMock: HttpTestingController;

  const resumenVacio = {
    fecha: '2026-10-14',
    monto_efectivo: 0,
    monto_tarjeta: 0,
    monto_transferencia: 0,
    monto_otro: 0,
    total_cobrado: 0,
    total_pagos: 0,
    cerrado: false,
    cierre: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Caja],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
      .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(Caja);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Responde las peticiones iniciales del componente
    httpMock
      .match((req) => req.url.startsWith('http://localhost:8000/api/pagos/'))[0]
      .flush([]);
    httpMock.match('http://localhost:8000/api/pedidos/')[0].flush([]);
    httpMock.match('http://localhost:8000/api/mesas/')[0].flush([]);
    httpMock.match('http://localhost:8000/api/cierres/resumen/')[0].flush(resumenVacio);
    httpMock.match('http://localhost:8000/api/cierres/')[0].flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería sumar los cobros del turno actual', () => {
    const pagoHoy: IPago = {
      id_pago: 1,
      pedido: 1,
      numero_mesa: 1,
      estado_pedido: 'CERRADO',
      metodo_pago: 'EFECTIVO',
      monto: 1100,
      propina: 100,
      importe_recibido: 1100,
      fecha_hora: new Date().toISOString(),
      cajero: null,
      nombre_cajero: null,
    };

    expect(component.totalCobrado()).toBe(0);

    component.pagos.set([pagoHoy]);
    expect(component.totalCobrado()).toBe(1100);
    expect(component.mesasLiberadas()).toBe(1);
  });

  it('debería excluir los cobros de días anteriores (no acumula turnos)', () => {
    component.pagos.set([
      {
        id_pago: 2,
        pedido: 2,
        numero_mesa: 2,
        estado_pedido: 'CERRADO',
        metodo_pago: 'EFECTIVO',
        monto: 500,
        propina: 0,
        importe_recibido: 500,
        fecha_hora: '2020-01-01T10:00:00-03:00',
        cajero: null,
        nombre_cajero: null,
      },
    ]);

    expect(component.totalCobrado()).toBe(0);
    expect(component.mesasLiberadas()).toBe(0);
  });

  it('debería aplicar la propina al total solo si está marcada', () => {
    const pedido: IPedido = {
      id_pedido: 1,
      fecha_hora: '2026-09-13T17:00:00-03:00',
      estado: 'LISTO',
      total: 1000,
      mesa: 1,
      usuario: 1,
      detalles: [],
    };

    component.pedidoSeleccionado.set(pedido);
    expect(component.propinaSugerida()).toBe(100);
    expect(component.totalACobrar()).toBe(1000);

    component.incluirPropina.set(true);
    expect(component.totalACobrar()).toBe(1100);
  });

  it('debería rechazar el cobro en efectivo si el importe recibido es menor al total a cobrar', () => {
    const pedido: IPedido = {
      id_pedido: 1,
      fecha_hora: '2026-09-13T17:00:00-03:00',
      estado: 'LISTO',
      total: 1000,
      mesa: 1,
      usuario: 1,
      detalles: [],
    };

    component.pedidoSeleccionado.set(pedido);
    component.metodoPagoActivo.set('EFECTIVO');
    component.importeRecibido.set('500');

    component.confirmarCobro();

    expect(component.errorCobros()).toContain('importe recibido');
  });
});
