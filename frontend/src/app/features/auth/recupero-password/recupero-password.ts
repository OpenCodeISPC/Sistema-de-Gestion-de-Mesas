import { Component,OnInit, OnChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecuperoPasswordService } from '../../../services/recupero-password.service';
import { IRecuperoPassword, IRecuperoPasswordResponse } from '../../../models/irecupero-password';


@Component({
  selector: 'app-recupero-password',
  imports: [],
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

    this.recuperoPasswordService.solicitarRecuperoPassword(this.emailForm.value).subscribe({
      next: (res) => {
        this.mensajeExito = res.message || 'Correo de recuperación enviado con éxito.';
        this.mensajeError = '';
      },
      error: (err) => {
        this.mensajeError = 'Ocurrió un error al procesar la solicitud.';
        this.mensajeExito = '';
      }
    });
  }

  // Paso 2: Enviar la nueva contraseña usando el uid y el token
  restablecer(): void {
    if (this.confirmForm.invalid) return;

    const payload = {
      uid: this.uid,
      token: this.token,
      new_password: this.confirmForm.value.new_password
    };

    this.recuperoPasswordService.restablecerPassword(payload).subscribe({
      next: (res) => {
        this.mensajeExito = res.message || 'Contraseña restablecida con éxito.';
        setTimeout(() => this.router.navigate(['/']), 2000); // Redirige al login tras 2 segundos
      },
      error: (err) => {
        this.mensajeError = err.error?.token || err.error?.uid || 'El enlace es inválido o expiró.';
        this.mensajeExito = '';
      }
    });
  }
}
