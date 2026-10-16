import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { RecuperoPassword } from './recupero-password';

const API = 'http://localhost:8000/api/auth/';

describe('RecuperoPassword', () => {
  let component: RecuperoPassword;
  let fixture: ComponentFixture<RecuperoPassword>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecuperoPassword],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    })
    .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(RecuperoPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.paso).toBe('email');
  });

  it('pasa al paso del código después de solicitarlo', () => {
    component.emailForm.setValue({ email: 'mozo@gmail.com' });
    component.solicitar();

    const req = httpMock.expectOne(`${API}password-reset/`);
    expect(req.request.body).toEqual({ email: 'mozo@gmail.com' });
    req.flush({ message: 'Si la cuenta existe, recibirás un código.' });

    expect(component.paso).toBe('codigo');
  });

  it('muestra el error del backend si el código es inválido', () => {
    component.email = 'mozo@gmail.com';
    component.paso = 'codigo';
    component.codigoForm.setValue({ codigo: '123456' });
    component.verificar();

    httpMock
      .expectOne(`${API}password-reset/verificar/`)
      .flush({ codigo: ['El código es inválido o expiró.'] }, { status: 400, statusText: 'Bad Request' });

    expect(component.paso).toBe('codigo');
    expect(component.mensajeError).toBe('El código es inválido o expiró.');
  });

  it('pasa al paso de contraseña si el código es válido', () => {
    component.email = 'mozo@gmail.com';
    component.codigoForm.setValue({ codigo: '123456' });
    component.verificar();

    httpMock.expectOne(`${API}password-reset/verificar/`).flush({ message: 'Código verificado.' });

    expect(component.paso).toBe('password');
  });

  it('marca error si las contraseñas no coinciden', () => {
    component.passwordForm.setValue({ new_password: 'claveNueva', confirmar_password: 'otraClave' });

    expect(component.passwordForm.hasError('passwordsDistintas')).toBeTrue();
  });
});
