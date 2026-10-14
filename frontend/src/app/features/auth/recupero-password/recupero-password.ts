import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RecuperoPasswordService } from '../../../services/recupero-password.service';

/** Pasos del flujo de recupero: correo -> código OTP -> nueva contraseña. */
type PasoRecupero = 'email' | 'codigo' | 'password';

/** Validador de grupo: la contraseña y su confirmación deben coincidir. */
const passwordsIguales = (grupo: AbstractControl): ValidationErrors | null =>
  grupo.get('new_password')?.value === grupo.get('confirmar_password')?.value
    ? null
    : { passwordsDistintas: true };

@Component({
  selector: 'app-recupero-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recupero-password.html',
  styleUrl: './recupero-password.css',
})
export class RecuperoPassword {
  private readonly fb = inject(FormBuilder);
  private readonly recuperoPasswordService = inject(RecuperoPasswordService);
  private readonly router = inject(Router);

  paso: PasoRecupero = 'email';
  email = '';
  cargando = false;
  mensajeExito = '';
  mensajeError = '';

  // Paso 1: correo del usuario
  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // Paso 2: código OTP de 6 dígitos
  codigoForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  // Paso 3: nueva contraseña (mismas reglas que el registro)
  passwordForm = this.fb.group(
    {
      new_password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
      confirmar_password: ['', [Validators.required]],
    },
    { validators: passwordsIguales }
  );

  // Paso 1: solicitar el código OTP
  solicitar(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.email = String(this.emailForm.value.email).trim();
    this.enviarCodigo();
  }

  // Reenvía el código al mismo correo sin volver al paso 1
  reenviarCodigo(): void {
    this.codigoForm.reset();
    this.enviarCodigo();
  }

  // Paso 2: verificar el código OTP
  verificar(): void {
    if (this.codigoForm.invalid) {
      this.codigoForm.markAllAsTouched();
      return;
    }

    this.iniciarPeticion();

    this.recuperoPasswordService
      .verificarCodigo({ email: this.email, codigo: this.codigoIngresado })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.paso = 'password';
        },
        error: (err) => this.manejarError(err),
      });
  }

  // Paso 3: guardar la nueva contraseña
  restablecer(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.iniciarPeticion();

    const payload = {
      email: this.email,
      codigo: this.codigoIngresado,
      new_password: String(this.passwordForm.value.new_password),
    };

    this.recuperoPasswordService.restablecerPassword(payload).subscribe({
      next: (res) => {
        this.cargando = false;
        this.mensajeExito = res.message || 'Contraseña restablecida con éxito.';
        this.passwordForm.disable();
        setTimeout(() => this.router.navigate(['/']), 2000);
      },
      error: (err) => this.manejarError(err),
    });
  }

  // Permite corregir el correo ingresado
  cambiarEmail(): void {
    this.paso = 'email';
    this.codigoForm.reset();
    this.passwordForm.reset();
    this.limpiarMensajes();
  }

  /** Deja solo los números en el campo del código (máximo 6). */
  soloNumeros(): void {
    const control = this.codigoForm.get('codigo');
    const limpio = String(control?.value ?? '').replace(/\D/g, '').slice(0, 6);
    if (control?.value !== limpio) {
      control?.setValue(limpio);
    }
  }

  private get codigoIngresado(): string {
    return String(this.codigoForm.value.codigo);
  }

  private enviarCodigo(): void {
    this.iniciarPeticion();

    this.recuperoPasswordService.solicitarRecuperoPassword({ email: this.email }).subscribe({
      next: (res) => {
        this.cargando = false;
        this.mensajeExito = res.message || `Enviamos un código de verificación a ${this.email}.`;
        this.paso = 'codigo';
      },
      error: (err) => this.manejarError(err),
    });
  }

  private iniciarPeticion(): void {
    this.cargando = true;
    this.limpiarMensajes();
  }

  private limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  /** Django REST Framework devuelve los errores como { campo: ["mensaje"] }. */
  private manejarError(err: HttpErrorResponse): void {
    this.cargando = false;

    const errorData = err?.error ?? {};
    const primero = (valor: unknown) => (Array.isArray(valor) ? valor[0] : valor);

    this.mensajeError =
      primero(errorData.codigo) ||
      primero(errorData.new_password) ||
      primero(errorData.email) ||
      errorData.detail ||
      errorData.message ||
      'Ocurrió un error al procesar la solicitud.';
  }
}
