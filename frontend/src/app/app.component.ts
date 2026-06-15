import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NavbarComponent],
  template: `
    <app-navbar />
    <main class="container mt-4 mb-5" style="min-height: calc(100vh - 260px);">
      <router-outlet />
    </main>
    <footer style="background: #1e293b; color: #94a3b8; padding: 30px 0; margin-top: auto;">
      <div class="container">
        <div class="row">
          <div class="col-md-4 mb-3 mb-md-0">
            <div class="d-flex align-items-center gap-2 mb-2">
              <span style="background: var(--brand-gradient); border-radius: 8px; padding: 5px 8px; display: inline-flex;">
                <i class="bi bi-cloud-fill text-white"></i>
              </span>
              <span class="fw-bold text-white">EV3 Cloud Store</span>
            </div>
            <p style="font-size: 0.85rem; margin: 0;">Plataforma de ventas online con microservicios en AWS.</p>
          </div>
          <div class="col-md-4 mb-3 mb-md-0">
            <h6 class="text-white fw-bold mb-2" style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Navegación</h6>
            <div class="d-flex flex-column gap-1">
              <a routerLink="/products" style="color: #94a3b8; text-decoration: none; font-size: 0.85rem;"><i class="bi bi-shop me-1"></i>Productos</a>
              @if (auth.isLoggedIn()) {
                <a routerLink="/cart" style="color: #94a3b8; text-decoration: none; font-size: 0.85rem;"><i class="bi bi-cart3 me-1"></i>Carrito</a>
                <a routerLink="/orders" style="color: #94a3b8; text-decoration: none; font-size: 0.85rem;"><i class="bi bi-receipt me-1"></i>Mis Compras</a>
                <a routerLink="/files" style="color: #94a3b8; text-decoration: none; font-size: 0.85rem;"><i class="bi bi-folder2-open me-1"></i>Mis Archivos</a>
              }
            </div>
          </div>
          <div class="col-md-4">
            <h6 class="text-white fw-bold mb-2" style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Tecnologías</h6>
            <div class="d-flex flex-wrap gap-2">
              <span class="badge" style="background: rgba(255,255,255,0.1); font-weight: 400;">Angular</span>
              <span class="badge" style="background: rgba(255,255,255,0.1); font-weight: 400;">FastAPI</span>
              <span class="badge" style="background: rgba(255,255,255,0.1); font-weight: 400;">AWS</span>
              <span class="badge" style="background: rgba(255,255,255,0.1); font-weight: 400;">Docker</span>
              <span class="badge" style="background: rgba(255,255,255,0.1); font-weight: 400;">Mercado Pago</span>
              <span class="badge" style="background: rgba(255,255,255,0.1); font-weight: 400;">S3</span>
            </div>
          </div>
        </div>
        <hr style="border-color: rgba(255,255,255,0.1); margin: 20px 0 15px;">
        <p class="text-center mb-0" style="font-size: 0.8rem;">
          EV3 Cloud Store — Proyecto Microservicios AWS · Universidad Católica del Maule
        </p>
      </div>
    </footer>
  `
})
export class App {
  constructor(public auth: AuthService) {}
}