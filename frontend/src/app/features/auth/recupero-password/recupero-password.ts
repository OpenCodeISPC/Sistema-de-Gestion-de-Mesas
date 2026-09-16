import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecuperoPasswordService } from '../../../services/recupero-password.service';

@Component({
  selector: 'app-recupero-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recupero-password.html',
  styleUrl: './recupero-password.css',
})
export class RecuperoPassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly recuperoPasswordService = inject(RecuperoPasswordService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router)

  emailForm! :FormGroup;
  confirmForm! :FormGroup;
  isTokenMode = false;
  uid = '';
  token = '';
  mensajeExito = '';
  mensajeError = '';

  ngOnInit(): void {
    // Capturamos los query params (uid y token) de la URL si vienen del correo
    this.route.queryParams.subscribe(params => {
      this.uid = params['uid'];
      this.token = params['token'];

      if (this.uid && this.token) {
        this.isTokenMode = true;
      }
    });

    // Formulario para solicitar el correo
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Formulario para ingresar la nueva contraseña
    this.confirmForm = this.fb.group({
      new_password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
    });
  }

  // Paso 1: Enviar correo para solicitar el link
  solicitar(): void {
    if (this.emailForm.invalid) return;

    const email = String(this.emailForm.get('email')?.value || '').trim();
    this.mensajeExito = '';
    this.mensajeError = '';

    this.recuperoPasswordService.solicitarRecuperoPassword(this.emailForm.value).subscribe({
      next: (res) => {
        this.mensajeExito = res.message
          ? `${res.message} Se envió a ${email}.`
          : `Se envió el correo de recuperación a ${email}.`;
      },
      error: (err) => {
        this.mensajeError = err?.error?.detail || err?.error?.message || 'Ocurrió un error al procesar la solicitud.';
      }
    });
  }

  // Paso 2: Enviar la nueva contraseña usando el uid y el token
  restablecer(): void {
    if (this.confirmForm.invalid) return;

    this.mensajeExito = '';
    this.mensajeError = '';

    const payload = {
      uid: this.uid,
      token: this.token,
      new_password: this.confirmForm.value.new_password
    };

    this.recuperoPasswordService.restablecerPassword(payload).subscribe({
      next: (res) => {
        this.mensajeExito = res.message || 'Contraseña restablecida con éxito.';
        setTimeout(() => this.router.navigate(['/']), 2000);
      },
      error: (err) => {
        this.mensajeError = err?.error?.detail || err?.error?.token || err?.error?.uid || 'El enlace es inválido o expiró.';
      }
    });
  }
}
