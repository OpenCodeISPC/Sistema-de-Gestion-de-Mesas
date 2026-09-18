import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { Caja } from './caja';
import { IPedido } from '../../models/ipedido';

describe('Caja', () => {
  let component: Caja;
  let fixture: ComponentFixture<Caja>;
  let httpMock: HttpTestingController;

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

    // Responde las peticiones iniciales del componente (pagos, pedidos y mesas)
    httpMock.match('http://localhost:8000/api/pagos/')[0].flush([]);
    httpMock.match('http://localhost:8000/api/pedidos/')[0].flush([]);
    httpMock.match('http://localhost:8000/api/mesas/')[0].flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería actualizar el total cobrado al registrar un pago', () => {
    const pedido: IPedido = {
      id_pedido: 1,
      fecha_hora: '2026-09-13T17:00:00-03:00',
      estado: 'LISTO',
      total: 1000,
      mesa: 1,
      usuario: 1,
      detalles: [],
    };

    expect(component.totalCobrado()).toBe(0);

    component.pagos.set([{
      id_pago: 1,
      pedido: 1,
      numero_mesa: 1,
      estado_pedido: 'CERRADO',
      metodo_pago: 'EFECTIVO',
      monto: 1100,
      propina: 100,
      importe_recibido: 1100,
      fecha_hora: '2026-09-13T17:00:00-03:00',
      cajero: null,
      nombre_cajero: null,
    }]);
    expect(component.totalCobrado()).toBe(1100);

    component.pedidoSeleccionado.set(pedido);
    expect(component.propinaSugerida()).toBe(100);
    expect(component.totalACobrar()).toBe(1100);
  });
});