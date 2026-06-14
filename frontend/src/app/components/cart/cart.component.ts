import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h2 class="mb-4"><i class="bi bi-cart3 me-2"></i>Mi Carrito</h2>

    @if (errorMsg) {
      <div class="alert alert-danger">{{ errorMsg }}</div>
    }

    @if (cart.items.length === 0) {
      <div class="text-center py-5">
        <i class="bi bi-cart-x" style="font-size: 64px; color: #ccc;"></i>
        <p class="mt-3 text-muted">Tu carrito está vacío</p>
        <a routerLink="/products" class="btn btn-primary">Ver productos</a>
      </div>
    } @else {
      <div class="card shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Producto</th>
                <th class="text-center">Precio</th>
                <th class="text-center">Cantidad</th>
                <th class="text-center">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of cart.items; track item.id) {
                <tr>
                  <td class="align-middle">{{ item.name }}</td>
                  <td class="text-center align-middle">\${{ item.price | number:'1.0-0' }}</td>
                  <td class="text-center align-middle">{{ item.quantity }}</td>
                  <td class="text-center align-middle fw-bold">\${{ item.subtotal | number:'1.0-0' }}</td>
                  <td class="text-end align-middle">
                    <button class="btn btn-outline-danger btn-sm" (click)="remove(item.id)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="table-primary">
                <td colspan="3" class="text-end fw-bold fs-5">Total:</td>
                <td class="text-center fw-bold fs-5">\${{ cart.total | number:'1.0-0' }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="d-flex justify-content-between mt-4">
        <button class="btn btn-outline-secondary" (click)="clearAll()">
          <i class="bi bi-trash me-1"></i>Vaciar carrito
        </button>
        <button class="btn btn-success btn-lg" (click)="checkout()" [disabled]="loading">
          <i class="bi bi-credit-card me-1"></i>
          {{ loading ? 'Procesando...' : 'Proceder al pago' }}
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

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    this.api.getCart().subscribe({
      next: (data) => this.cart = data,
      error: (err) => this.errorMsg = 'Error cargando carrito'
    });
  }

  remove(itemId: number) {
    this.api.removeFromCart(itemId).subscribe({
      next: () => this.loadCart(),
      error: () => this.errorMsg = 'Error eliminando producto'
    });
  }

  clearAll() {
    this.api.clearCart().subscribe({ next: () => this.loadCart() });
  }

  checkout() {
    this.loading = true;
    this.errorMsg = '';

    // 1. Crear orden
    this.api.createOrder().subscribe({
      next: (order) => {
        // 2. Crear preferencia de pago (checkout de Mercado Pago)
        this.api.createCheckout(order.order_id).subscribe({
          next: (payment) => {
            // 3. Redirigir a Mercado Pago
            if (payment.url_pago) {
              window.location.href = payment.url_pago;
            } else {
              this.errorMsg = 'No se pudo obtener URL de pago';
              this.loading = false;
            }
          },
          error: (err) => {
            this.errorMsg = err.error?.detail || 'Error creando pago';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error creando orden';
        this.loading = false;
      }
    });
  }
}
