import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="row justify-content-center" style="margin-top: 5vh;">
      <div class="col-md-5 col-lg-4">
        <div class="text-center mb-4">
          <span style="background: linear-gradient(135deg, #818cf8, #06b6d4); border-radius: 16px; padding: 14px 18px; display: inline-flex;">
            <i class="bi bi-cloud-fill text-white" style="font-size: 2rem;"></i>
          </span>
          <h3 class="mt-3 fw-bold">Bienvenido de vuelta</h3>
          <p class="text-muted">Inicia sesión en tu cuenta</p>
        </div>

        <div class="card shadow-sm border-0" style="border-radius: 16px;">
          <div class="card-body p-4">
            @if (errorMsg) {
              <div class="alert alert-danger d-flex align-items-center" style="font-size: 0.9rem;">
                <i class="bi bi-exclamation-circle me-2"></i>{{ errorMsg }}
              </div>
            }

            <div class="mb-3">
              <label class="form-label fw-medium" style="font-size: 0.88rem;">Email</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0"><i class="bi bi-envelope text-muted"></i></span>
                <input type="email" class="form-control border-start-0" [(ngModel)]="email" placeholder="tu&#64;email.com" style="font-size: 0.95rem;">
              </div>
            </div>
            <div class="mb-4">
              <label class="form-label fw-medium" style="font-size: 0.88rem;">Contraseña</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0"><i class="bi bi-lock text-muted"></i></span>
                <input type="password" class="form-control border-start-0" [(ngModel)]="password" (keyup.enter)="login()" placeholder="••••••••" style="font-size: 0.95rem;">
              </div>
            </div>
            <button class="btn btn-primary w-100 py-2" (click)="login()" [disabled]="loading" style="border-radius: 10px; font-size: 0.95rem;">
              @if (loading) {
                <span class="spinner-border spinner-border-sm me-2"></span>Ingresando...
              } @else {
                <i class="bi bi-box-arrow-in-right me-2"></i>Ingresar
              }
            </button>
          </div>
        </div>
        <p class="text-center mt-3 text-muted" style="font-size: 0.9rem;">
          ¿No tienes cuenta? <a routerLink="/register" class="fw-semibold" style="color: var(--ev3-primary); text-decoration: none;">Regístrate aquí</a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  errorMsg = '';
  loading = false;

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  login() {
    this.loading = true;
    this.errorMsg = '';
    this.api.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.auth.setToken(res.access_token);
        this.auth.setUserName(res.full_name);
        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error al iniciar sesión';
        this.loading = false;
      }
    });
  }
}
