import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-title">
      <i class="bi bi-cart3"></i>
      <span>Mi Carrito</span>
    </div>

    @if (errorMsg) {
      <div class="alert alert-danger d-flex align-items-center"><i class="bi bi-exclamation-circle me-2"></i>{{ errorMsg }}</div>
    }

    @if (cart.items.length === 0) {
      <div class="text-center py-5">
        <div style="background: #f1f5f9; border-radius: 50%; width: 100px; height: 100px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
          <i class="bi bi-cart-x" style="font-size: 40px; color: #94a3b8;"></i>
        </div>
        <h5 class="fw-bold">Tu carrito está vacío</h5>
        <p class="text-muted">Agrega productos para comenzar</p>
        <a routerLink="/products" class="btn btn-primary" style="border-radius: 10px;">
          <i class="bi bi-shop me-1"></i>Ver productos
        </a>
      </div>
    } @else {
      <div class="card border-0 shadow-sm" style="border-radius: 16px; overflow: hidden;">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead style="background: #f8fafc;">
              <tr>
                <th class="py-3 ps-4">Producto</th>
                <th class="py-3 text-center">Precio</th>
                <th class="py-3 text-center">Cantidad</th>
                <th class="py-3 text-center">Subtotal</th>
                <th class="py-3 pe-4"></th>
              </tr>
            </thead>
            <tbody>
              @for (item of cart.items; track item.id) {
                <tr>
                  <td class="align-middle ps-4 fw-medium">{{ item.name }}</td>
                  <td class="text-center align-middle text-muted">\${{ item.price | number:'1.0-0' }}</td>
                  <td class="text-center align-middle">
                    <span class="badge" style="background: #f1f5f9; color: var(--ev3-text); font-size: 0.9rem; padding: 6px 14px; border-radius: 8px;">{{ item.quantity }}</span>
                  </td>
                  <td class="text-center align-middle fw-bold" style="color: var(--ev3-primary);">\${{ item.subtotal | number:'1.0-0' }}</td>
                  <td class="text-end align-middle pe-4">
                    <button class="btn btn-sm" style="background: #fef2f2; color: var(--ev3-danger); border-radius: 8px;" (click)="remove(item.id)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div style="background: linear-gradient(135deg, #f0f9ff, #eff6ff); padding: 20px 24px; display: flex; align-items: center; justify-content: flex-end; gap: 12px;">
          <span class="text-muted fw-medium">Total:</span>
          <span class="fw-bold" style="font-size: 1.5rem; background: var(--ev3-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            \${{ cart.total | number:'1.0-0' }}
          </span>
        </div>
      </div>

      <div class="d-flex justify-content-between mt-4">
        <button class="btn btn-outline-secondary" style="border-radius: 10px;" (click)="clearAll()">
          <i class="bi bi-trash me-1"></i>Vaciar carrito
        </button>
        <button class="btn btn-success btn-lg px-4" (click)="checkout()" [disabled]="loading" style="border-radius: 12px;">
          @if (loading) {
            <span class="spinner-border spinner-border-sm me-2"></span>Procesando...
          } @else {
            <i class="bi bi-credit-card me-2"></i>Proceder al pago
          }
        </button>
      </div>
    }
  `
})
export class CartComponent implements OnInit {
  cart: any = { items: [], total: 0 };
  errorMsg = '';
  loading = false;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() { this.loadCart(); }

  loadCart() {
    this.api.getCart().subscribe({
      next: (data) => this.cart = data,
      error: (err) => this.errorMsg = 'Error cargando carrito'
    });
  }

  remove(itemId: number) {
    this.api.removeFromCart(itemId).subscribe({ next: () => this.loadCart(), error: () => this.errorMsg = 'Error eliminando producto' });
  }

  clearAll() {
    this.api.clearCart().subscribe({ next: () => this.loadCart() });
  }

  checkout() {
    this.loading = true;
    this.errorMsg = '';
    this.api.createOrder().subscribe({
      next: (order) => {
        this.api.createCheckout(order.order_id).subscribe({
          next: (payment) => {
            if (payment.url_pago) { window.location.href = payment.url_pago; }
            else { this.errorMsg = 'No se pudo obtener URL de pago'; this.loading = false; }
          },
          error: (err) => { this.errorMsg = err.error?.detail || 'Error creando pago'; this.loading = false; }
        });
      },
      error: (err) => { this.errorMsg = err.error?.detail || 'Error creando orden'; this.loading = false; }
    });
  }
}
