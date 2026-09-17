import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegistroService } from '../../../services/registro.service';
import { RolUser, IRegistroRequest } from '../../../models/iregistro';
import { environments } from '../../.././../environments/environments';

declare const google: any;

@Component({
  selector: 'app-registro',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly registroService = inject(RegistroService);
  private readonly router = inject(Router);

  registroForm!: FormGroup;
  rolDisponibles: RolUser[] = ['ADMIN', 'MOZO', 'CAJERO', 'COCINA'];

  mensajeError = '';
  mensajeExito = '';
  cargando = false;

  constructor() {
    this.registroForm = this.fb.group(
      {
        nombre: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(60),
          ],
        ],
        apellido: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(60),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(20),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
        rol: ['MOZO' as RolUser, [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }
  ngAfterViewInit(): void {
    // Inicializar botón oficial de Google en cuanto cargue la vista
    this.initGoogleRegisterButton();
  }
  private passwordMatchValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordmismatch: true };
  }
  setRol(rol: RolUser): void {
    this.registroForm.patchValue({ rol });
  }
  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const payload: IRegistroRequest = {
      nombre: this.registroForm.value.nombre.trim(),
      apellido: this.registroForm.value.apellido.trim(),
      email: this.registroForm.value.email.trim(), 
      rol: this.registroForm.value.rol as RolUser,
      password: this.registroForm.value.password,
    };

    this.registroService.registrarUsuario(payload).subscribe({
      next:(res) => { 
        this.cargando = false;
        this.mensajeExito = '¡Registro exitoso! Redirigiendo a inicio de sesión...';

        if (res.access) localStorage.setItem('access', res.access);
        if (res.refresh) localStorage.setItem('refresh', res.refresh);
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (err) => {
        this.cargando = false;
        const errorData = err.error;

        if (errorData && typeof errorData === 'object') {
        const keys = Object.keys(errorData);
        const firstKey = keys[0];
        const errorMessages = errorData[firstKey];
        this.mensajeError = Array.isArray(errorMessages)
          ? `${firstKey}: ${errorMessages[0]}`
          : (errorData.detail || 'Ocurrió un error en el registro. Por favor, inténtalo de nuevo.');
        } else {
          this.mensajeError = 'Error al registrar el usuario. Por favor, inténtalo de nuevo.';
        }
      }
    });
  }
  private initGoogleRegisterButton():void{
    try{
      const container = document.getElementById('google-register-btn-container');
      if(!container) return ; 
      google.accounts.id.initialize({
        client_id: environments.googleClientId,
        callback: (response: any) => this.handleGoogleRegister(response.credential),
      });
      google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with',
      });
    }catch(e){
      console.error('Error al inicializar Google SDK:', e);
    }
  }
  private handleGoogleRegister(credentialToken: string): void { 
    this.cargando = true;
    this.mensajeError = '';

    // Tipado seguro del rol obtenido del formulario
    const selectedRol: RolUser = this.registroForm.get('rol')?.value || 'MOZO';

    const payload = {
      provider: 'google' as const,
      token: credentialToken,
      rol: selectedRol
    };

    this.registroService.registrarUsuarioOauth(payload).subscribe({
      next: (res) => {
        this.cargando = false;
        this.mensajeExito = 'Registro con Google exitoso.';
        
        if (res.access) localStorage.setItem('access', res.access);
        if (res.refresh) localStorage.setItem('refresh', res.refresh);
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));

        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err?.error?.detail || 'Error al registrarse con Google.';
      }
    });
  }
}
