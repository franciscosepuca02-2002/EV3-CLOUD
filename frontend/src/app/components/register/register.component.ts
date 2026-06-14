import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-5">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h3 class="text-center mb-4"><i class="bi bi-person-plus me-2"></i>Registro</h3>

            @if (errorMsg) {
              <div class="alert alert-danger">{{ errorMsg }}</div>
            }
            @if (successMsg) {
              <div class="alert alert-success">{{ successMsg }}</div>
            }

            <div class="mb-3">
              <label class="form-label">Nombre completo</label>
              <input type="text" class="form-control" [(ngModel)]="fullName" placeholder="Juan Pérez">
            </div>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [(ngModel)]="email" placeholder="tu@email.com">
            </div>
            <div class="mb-3">
              <label class="form-label">Teléfono (con código país, ej: +56912345678)</label>
              <input type="text" class="form-control" [(ngModel)]="phone" placeholder="+56912345678">
            </div>
            <div class="mb-3">
              <label class="form-label">Contraseña</label>
              <input type="password" class="form-control" [(ngModel)]="password">
            </div>
            <div class="mb-3">
              <label class="form-label">Confirmar contraseña</label>
              <input type="password" class="form-control" [(ngModel)]="confirmPassword">
            </div>
            <button class="btn btn-primary w-100" (click)="register()" [disabled]="loading">
              {{ loading ? 'Registrando...' : 'Crear cuenta' }}
            </button>
            <p class="text-center mt-3 mb-0">
              ¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  fullName = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  errorMsg = '';
  successMsg = '';
  loading = false;

  constructor(private api: ApiService, private router: Router) {}

  register() {
    this.errorMsg = '';
    this.successMsg = '';

    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Las contraseñas no coinciden';
      return;
    }
    if (this.password.length < 6) {
      this.errorMsg = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.loading = true;
    this.api.register({
      email: this.email,
      password: this.password,
      full_name: this.fullName,
      phone: this.phone || ''
    }).subscribe({
      next: () => {
        this.successMsg = 'Cuenta creada. Revisa tu correo para el código de verificación.';
        setTimeout(() => {
          this.router.navigate(['/verify'], { queryParams: { email: this.email } });
        }, 2000);
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error al registrar';
        this.loading = false;
      }
    });
  }
}
