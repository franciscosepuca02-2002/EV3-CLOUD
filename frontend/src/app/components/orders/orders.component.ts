import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-title">
      <i class="bi bi-receipt"></i>
      <span>Mis Compras</span>
    </div>

    @if (orders.length === 0) {
      <div class="text-center py-5">
        <div style="background: #f1f5f9; border-radius: 50%; width: 100px; height: 100px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
          <i class="bi bi-bag-x" style="font-size: 40px; color: #94a3b8;"></i>
        </div>
        <h5 class="fw-bold">No tienes compras aún</h5>
        <p class="text-muted">Explora nuestros productos y realiza tu primera compra</p>
        <a routerLink="/products" class="btn btn-primary" style="border-radius: 10px;">
          <i class="bi bi-shop me-1"></i>Ver productos
        </a>
      </div>
    } @else {
      <div class="d-flex flex-column gap-3">
        @for (order of orders; track order.id) {
          <div class="card border-0 shadow-sm" style="border-radius: 14px;">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <i class="bi bi-receipt" style="color: var(--ev3-primary);"></i>
                    <h6 class="fw-bold mb-0">{{ order.order_number }}</h6>
                  </div>
                  <p class="text-muted small mb-0"><i class="bi bi-calendar3 me-1"></i>{{ order.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
                <div class="text-end">
                  <span class="badge" [class]="getStatusClass(order.status)" style="font-size: 0.78rem;">
                    <i [class]="getStatusIcon(order.status)" class="me-1"></i>{{ getStatusLabel(order.status) }}
                  </span>
                  <p class="fw-bold mb-0 mt-2" style="font-size: 1.2rem; color: var(--ev3-primary);">\${{ order.total | number:'1.0-0' }}</p>
                </div>
              </div>

              @if (selectedOrder?.id === order.id && orderDetail) {
                <hr style="border-color: var(--ev3-border);">
                <div class="table-responsive">
                  <table class="table table-sm mb-0">
                    <thead><tr><th>Producto</th><th class="text-center">Cant.</th><th class="text-end">Precio</th></tr></thead>
                    <tbody>
                      @for (item of orderDetail.items; track item.name) {
                        <tr>
                          <td>{{ item.name }}</td>
                          <td class="text-center">{{ item.quantity }}</td>
                          <td class="text-end">\${{ item.price | number:'1.0-0' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                @if (orderDetail.payment_id) {
                  <div class="mt-3 p-3" style="background: #f8fafc; border-radius: 10px; font-size: 0.85rem;">
                    <i class="bi bi-credit-card me-1 text-muted"></i>
                    <strong>ID Pago:</strong> {{ orderDetail.payment_id }}
                    <span class="mx-2 text-muted">|</span>
                    <strong>Estado:</strong> {{ orderDetail.payment_status }}
                  </div>
                }
              }

              <button class="btn btn-sm mt-3" style="background: #f1f5f9; color: var(--ev3-primary); border-radius: 8px; font-weight: 500;"
                      (click)="toggleDetail(order)">
                <i [class]="selectedOrder?.id === order.id ? 'bi bi-chevron-up' : 'bi bi-chevron-down'" class="me-1"></i>
                {{ selectedOrder?.id === order.id ? 'Ocultar detalle' : 'Ver detalle' }}
              </button>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  selectedOrder: any = null;
  orderDetail: any = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getOrders().subscribe({
      next: (data) => this.orders = data,
      error: (err) => console.error('Error cargando órdenes', err)
    });
  }

  toggleDetail(order: any) {
    if (this.selectedOrder?.id === order.id) { this.selectedOrder = null; this.orderDetail = null; return; }
    this.selectedOrder = order;
    this.api.getOrder(order.id).subscribe({ next: (data) => this.orderDetail = data, error: () => this.orderDetail = null });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'bg-success';
      case 'pending': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  }
  getStatusIcon(status: string): string {
    switch (status) {
      case 'paid': return 'bi bi-check-circle';
      case 'pending': return 'bi bi-clock';
      default: return 'bi bi-question-circle';
    }
  }
  getStatusLabel(status: string): string {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      default: return status;
    }
  }
}
