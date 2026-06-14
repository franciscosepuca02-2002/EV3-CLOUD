import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2 class="mb-4"><i class="bi bi-receipt me-2"></i>Mis Compras</h2>

    @if (orders.length === 0) {
      <div class="text-center py-5">
        <i class="bi bi-bag-x" style="font-size: 64px; color: #ccc;"></i>
        <p class="mt-3 text-muted">No tienes compras aún</p>
      </div>
    } @else {
      @for (order of orders; track order.id) {
        <div class="card shadow-sm mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h5 class="mb-1">{{ order.order_number }}</h5>
                <p class="text-muted small mb-0">{{ order.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
              <div class="text-end">
                <span class="badge" [class]="getStatusClass(order.status)">
                  {{ getStatusLabel(order.status) }}
                </span>
                <p class="fw-bold fs-5 mb-0 mt-1">\${{ order.total | number:'1.0-0' }}</p>
              </div>
            </div>

            @if (selectedOrder?.id === order.id && orderDetail) {
              <hr>
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
              @if (orderDetail.payment_id) {
                <div class="mt-2 small text-muted">
                  <strong>ID Pago:</strong> {{ orderDetail.payment_id }} |
                  <strong>Estado pago:</strong> {{ orderDetail.payment_status }}
                </div>
              }
            }

            <button class="btn btn-sm btn-outline-primary mt-2"
                    (click)="toggleDetail(order)">
              {{ selectedOrder?.id === order.id ? 'Ocultar detalle' : 'Ver detalle' }}
            </button>
          </div>
        </div>
      }
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
    if (this.selectedOrder?.id === order.id) {
      this.selectedOrder = null;
      this.orderDetail = null;
      return;
    }
    this.selectedOrder = order;
    this.api.getOrder(order.id).subscribe({
      next: (data) => this.orderDetail = data,
      error: () => this.orderDetail = null
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'bg-success';
      case 'pending': return 'bg-warning text-dark';
      default: return 'bg-secondary';
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
