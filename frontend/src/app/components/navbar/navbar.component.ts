import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg" style="background: linear-gradient(135deg, #1e1b4b, #312e81, #3730a3); box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center" routerLink="/products" style="gap: 10px;">
          <span style="background: linear-gradient(135deg, #818cf8, #06b6d4); border-radius: 10px; padding: 6px 10px; display: flex;">
            <i class="bi bi-cloud-fill text-white" style="font-size: 1.3rem;"></i>
          </span>
          <span class="fw-bold text-white" style="font-size: 1.15rem;">EV3 Cloud Store</span>
        </a>
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav mx-auto" style="gap: 4px;">
            <li class="nav-item">
              <a class="nav-link text-white px-3 rounded-pill" routerLink="/products" routerLinkActive="active"
                 style="transition: all 0.2s; font-size: 0.9rem; font-weight: 500;">
                <i class="bi bi-shop me-1"></i>Productos
              </a>
            </li>
            @if (auth.isLoggedIn()) {
              <li class="nav-item">
                <a class="nav-link text-white px-3 rounded-pill" routerLink="/cart" routerLinkActive="active"
                   style="transition: all 0.2s; font-size: 0.9rem; font-weight: 500;">
                  <i class="bi bi-cart3 me-1"></i>Carrito
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link text-white px-3 rounded-pill" routerLink="/orders" routerLinkActive="active"
                   style="transition: all 0.2s; font-size: 0.9rem; font-weight: 500;">
                  <i class="bi bi-receipt me-1"></i>Mis Compras
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link text-white px-3 rounded-pill" routerLink="/files" routerLinkActive="active"
                   style="transition: all 0.2s; font-size: 0.9rem; font-weight: 500;">
                  <i class="bi bi-folder2-open me-1"></i>Mis Archivos
                </a>
              </li>
            }
          </ul>
          <div class="d-flex align-items-center" style="gap: 10px;">
            @if (auth.isLoggedIn()) {
              <span class="d-flex align-items-center text-white" style="gap: 6px; font-size: 0.9rem; background: rgba(255,255,255,0.1); padding: 5px 14px; border-radius: 50px;">
                <i class="bi bi-person-circle" style="font-size: 1.1rem;"></i>
                {{ auth.getUserName() }}
              </span>
              <button class="btn btn-sm text-white" style="background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); border-radius: 50px; padding: 5px 14px; font-size: 0.85rem; font-weight: 500;"
                      (click)="auth.logout()">
                <i class="bi bi-box-arrow-right me-1"></i>Salir
              </button>
            } @else {
              <a class="btn btn-sm text-white" routerLink="/login"
                 style="border: 1px solid rgba(255,255,255,0.3); border-radius: 50px; padding: 5px 16px; font-size: 0.85rem; font-weight: 500;">
                Iniciar Sesión
              </a>
              <a class="btn btn-sm" routerLink="/register"
                 style="background: linear-gradient(135deg, #818cf8, #06b6d4); color: white; border-radius: 50px; padding: 5px 16px; font-size: 0.85rem; font-weight: 500;">
                Registrarse
              </a>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav-link.active {
      background: rgba(255,255,255,0.15) !important;
    }
    .nav-link:hover {
      background: rgba(255,255,255,0.1);
    }
  `]
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}
}
