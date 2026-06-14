import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand fw-bold" routerLink="/products">
          <i class="bi bi-cloud-fill me-2"></i>EV3 Cloud Store
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/products" routerLinkActive="active">
                <i class="bi bi-shop me-1"></i>Productos
              </a>
            </li>
            @if (auth.isLoggedIn()) {
              <li class="nav-item">
                <a class="nav-link" routerLink="/cart" routerLinkActive="active">
                  <i class="bi bi-cart3 me-1"></i>Carrito
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/orders" routerLinkActive="active">
                  <i class="bi bi-receipt me-1"></i>Mis Compras
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/files" routerLinkActive="active">
                  <i class="bi bi-folder2-open me-1"></i>Mis Archivos
                </a>
              </li>
            }
          </ul>
          <div class="d-flex align-items-center">
            @if (auth.isLoggedIn()) {
              <span class="text-light me-3">
                <i class="bi bi-person-circle me-1"></i>{{ auth.getUserName() }}
              </span>
              <button class="btn btn-outline-light btn-sm" (click)="auth.logout()">
                <i class="bi bi-box-arrow-right me-1"></i>Salir
              </button>
            } @else {
              <a class="btn btn-outline-light btn-sm me-2" routerLink="/login">Iniciar Sesión</a>
              <a class="btn btn-light btn-sm" routerLink="/register">Registrarse</a>
            }
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}
}
