import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-5">
        <div class="card shadow-sm">
          <div class="card-body p-4 text-center">
            <i class="bi bi-envelope-check" style="font-size: 48px; color: #0d6efd;"></i>
            <h3 class="mt-3 mb-2">Verificar Cuenta</h3>
            <p class="text-muted">Ingresa el código de 6 dígitos que enviamos a tu correo.</p>

            @if (errorMsg) {
              <div class="alert alert-danger">{{ errorMsg }}</div>
            }
            @if (successMsg) {
              <div class="alert alert-success">{{ successMsg }}</div>
            }

            <div class="mb-3 text-start">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [(ngModel)]="email">
            </div>
            <div class="mb-3">
              <input type="text" class="form-control form-control-lg text-center"
                     [(ngModel)]="code" placeholder="000000" maxlength="6"
                     style="letter-spacing: 12px; font-size: 24px;"
                     (keyup.enter)="verify()">
            </div>
            <button class="btn btn-primary w-100" (click)="verify()" [disabled]="loading">
              {{ loading ? 'Verificando...' : 'Verificar' }}
            </button>
            <p class="mt-3"><a routerLink="/login">Volver al login</a></p>
          </div>
        </div>
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
