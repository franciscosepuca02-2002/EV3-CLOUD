import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="row justify-content-center" style="margin-top: 5vh;">
      <div class="col-md-5 col-lg-4">
        <div class="text-center mb-4">
          <span style="background: linear-gradient(135deg, #818cf8, #06b6d4); border-radius: 16px; padding: 14px 18px; display: inline-flex;">
            <i class="bi bi-envelope-check text-white" style="font-size: 2rem;"></i>
          </span>
          <h3 class="mt-3 fw-bold">Verificar Cuenta</h3>
          <p class="text-muted">Ingresa el código de 6 dígitos que enviamos a tu correo</p>
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
              <label class="form-label fw-medium" style="font-size: 0.88rem;">Email</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0"><i class="bi bi-envelope text-muted"></i></span>
                <input type="email" class="form-control border-start-0" [(ngModel)]="email">
              </div>
            </div>
            <div class="mb-4">
              <label class="form-label fw-medium" style="font-size: 0.88rem;">Código de verificación</label>
              <input type="text" class="form-control form-control-lg text-center fw-bold"
                     [(ngModel)]="code" placeholder="000000" maxlength="6"
                     style="letter-spacing: 14px; font-size: 1.8rem; border-radius: 12px; background: #f8fafc; border: 2px solid #e2e8f0;"
                     (keyup.enter)="verify()">
            </div>
            <button class="btn btn-primary w-100 py-2" (click)="verify()" [disabled]="loading" style="border-radius: 10px;">
              @if (loading) {
                <span class="spinner-border spinner-border-sm me-2"></span>Verificando...
              } @else {
                <i class="bi bi-shield-check me-2"></i>Verificar
              }
            </button>
          </div>
        </div>
        <p class="text-center mt-3"><a routerLink="/login" style="color: var(--ev3-primary); text-decoration: none; font-weight: 500;">← Volver al login</a></p>
      </div>
    </div>
  `
})
export class VerifyComponent implements OnInit {
  email = '';
  code = '';
  errorMsg = '';
  successMsg = '';
  loading = false;

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) this.email = params['email'];
    });
  }

  verify() {
    this.loading = true;
    this.errorMsg = '';
    this.api.verify({ email: this.email, code: this.code }).subscribe({
      next: () => {
        this.successMsg = '¡Cuenta verificada! Redirigiendo al login...';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Código incorrecto o expirado';
        this.loading = false;
      }
    });
  }
}
