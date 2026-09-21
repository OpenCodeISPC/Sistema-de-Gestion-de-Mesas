import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import {

  FormBuilder,

  FormGroup,

  ReactiveFormsModule,

  Validators,

} from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { LoginService } from '../../../services/login.service';

import { environments } from '../../.././../environments/environments';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../../../constants/auth.constants';



declare const google: any;



@Component({

  selector: 'app-login',

  standalone: true,

  imports: [CommonModule, ReactiveFormsModule, RouterLink],

  templateUrl: './login.html',

  styleUrl: './login.css',

})

export class Login implements OnInit {

  private readonly fb = inject(FormBuilder);

  private readonly loginService = inject(LoginService);

  private readonly router = inject(Router);



  loginForm!: FormGroup;

  mensajeError = '';

  mensajeExito = '';

  cargando = false;



  ngOnInit(): void {

    // 1. Inicializar formulario reactivo

    this.loginForm = this.fb.group({

      email: ['', [Validators.required, Validators.email]],

      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],

    });
    // 2. Inicializar botón oficial de Google en cuanto cargue la vista

    this.initGoogleButton();
  }



  // Lógica de inicio de sesión clásico (Correo y Contraseña)

  onSubmit(): void {

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;

    }



    this.cargando = true;

    this.mensajeError = '';

    this.mensajeExito = '';



    this.loginService.login(this.loginForm.value).subscribe({

      next: (res) => {

        this.cargando = false;

        this.mensajeExito = '¡Inicio de sesión exitoso! Redirigiendo...';



        // Guardar tokens y datos del usuario de forma segura asegurando el tipo string
        localStorage.setItem(AUTH_TOKEN_KEY, res.access!);
        localStorage.setItem(REFRESH_TOKEN_KEY, res.refresh!);
        localStorage.setItem('user', JSON.stringify(res.user));



        setTimeout(() => this.router.navigate(['/dashboard']), 1500);

      },

      error: (err) => {

        this.cargando = false;

        this.mensajeError =

          err?.error?.detail || 'Credenciales inválidas o cuenta inactiva.';

      },

    });

  }



  // Inicialización del SDK de Google Identity Services

  private initGoogleButton(): void {

    try {

      google.accounts.id.initialize({

        client_id: environments.googleClientId,

        callback: (response: any) =>

          this.handleGoogleCredential(response.credential),

      });



      google.accounts.id.renderButton(

        document.getElementById('google-btn-container'),

        {

          theme: 'outline',

          size: 'large',

          width: '100%',

          text: 'continue_with',

        },

      );

    } catch (e) {

      console.error('Error al inicializar Google SDK:', e);

    }

  }



  // Callback cuando Google valida exitosamente al usuario

  private handleGoogleCredential(credentialToken: string): void {

    this.cargando = true;

    this.mensajeError = '';



    this.loginService.loginOauth({ token: credentialToken }).subscribe({

      next: (res) => {

        this.cargando = false;

        this.mensajeExito = 'Autenticación con Google exitosa.';



        // Guardar tokens y datos del usuario de forma segura asegurando el tipo string
        localStorage.setItem(AUTH_TOKEN_KEY, res.access!);
        localStorage.setItem(REFRESH_TOKEN_KEY, res.refresh!);
        localStorage.setItem('user', JSON.stringify(res.user));



        setTimeout(() => this.router.navigate(['/dashboard']), 1500);

      },

      error: (err) => {

        this.cargando = false;

        this.mensajeError =

          err?.error?.detail ||

          'Error al autenticar con Google en el servidor.';

      },

    });

  }

}