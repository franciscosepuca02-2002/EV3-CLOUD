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
    <div class="row justify-content-center">
      <div class="col-md-5">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h3 class="text-center mb-4"><i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión</h3>

            @if (errorMsg) {
              <div class="alert alert-danger">{{ errorMsg }}</div>
            }

            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [(ngModel)]="email" placeholder="tu@email.com">
            </div>
            <div class="mb-3">
              <label class="form-label">Contraseña</label>
              <input type="password" class="form-control" [(ngModel)]="password" (keyup.enter)="login()">
            </div>
            <button class="btn btn-primary w-100" (click)="login()" [disabled]="loading">
              {{ loading ? 'Ingresando...' : 'Ingresar' }}
            </button>
            <p class="text-center mt-3 mb-0">
              ¿No tienes cuenta? <a routerLink="/register">Regístrate aquí</a>
            </p>
          </div>
        </div>
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
