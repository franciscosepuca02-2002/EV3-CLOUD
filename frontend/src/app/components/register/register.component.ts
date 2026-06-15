import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="row justify-content-center" style="margin-top: 3vh;">
      <div class="col-md-5 col-lg-4">
        <div class="text-center mb-4">
          <span style="background: linear-gradient(135deg, #818cf8, #06b6d4); border-radius: 16px; padding: 14px 18px; display: inline-flex;">
            <i class="bi bi-person-plus text-white" style="font-size: 2rem;"></i>
          </span>
          <h3 class="mt-3 fw-bold">Crear cuenta</h3>
          <p class="text-muted">Regístrate para comenzar a comprar</p>
        </div>

        <div class="card shadow-sm border-0" style="border-radius: 16px;">
          <div class="card-body p-4">
            @if (errorMsg) {
              <div class="alert alert-danger d-flex align-items-center" style="font-size: 0.9rem;">
                <i class="bi bi-exclamation-circle me-2"></i>{{ errorMsg }}
              </div>
            }
            @if (successMsg) {
              <div class="alert alert-success d-flex align-items-center" style="font-size: 0.9rem;">
                <i class="bi bi-check-circle me-2"></i>{{ successMsg }}
              </div>
            }

            <div class="mb-3">
              <label class="form-label fw-medium" style="font-size: 0.88rem;">Nombre completo</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0"><i class="bi bi-person text-muted"></i></span>
                <input type="text" class="form-control border-start-0" [(ngModel)]="fullName" placeholder="Juan Pérez">
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label fw-medium" style="font-size: 0.88rem;">Email</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0"><i class="bi bi-envelope text-muted"></i></span>
                <input type="email" class="form-control border-start-0" [(ngModel)]="email" placeholder="tu&#64;email.com">
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label fw-medium" style="font-size: 0.88rem;">Teléfono <span class="text-muted fw-normal">(ej: +56912345678)</span></label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0"><i class="bi bi-phone text-muted"></i></span>
                <input type="text" class="form-control border-start-0" [(ngModel)]="phone" placeholder="+56912345678">
              </div>
            </div>
            <div class="row">
              <div class="col-6 mb-3">
                <label class="form-label fw-medium" style="font-size: 0.88rem;">Contraseña</label>
                <input type="password" class="form-control" [(ngModel)]="password" placeholder="••••••">
              </div>
              <div class="col-6 mb-3">
                <label class="form-label fw-medium" style="font-size: 0.88rem;">Confirmar</label>
                <input type="password" class="form-control" [(ngModel)]="confirmPassword" placeholder="••••••">
              </div>
            </div>
            <button class="btn btn-primary w-100 py-2" (click)="register()" [disabled]="loading" style="border-radius: 10px;">
              @if (loading) {
                <span class="spinner-border spinner-border-sm me-2"></span>Registrando...
              } @else {
                <i class="bi bi-person-plus me-2"></i>Crear cuenta
              }
            </button>
          </div>
        </div>
        <p class="text-center mt-3 text-muted" style="font-size: 0.9rem;">
          ¿Ya tienes cuenta? <a routerLink="/login" class="fw-semibold" style="color: var(--ev3-primary); text-decoration: none;">Inicia sesión</a>
        </p>
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
