import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-6 text-center py-5">

        @if (status === 'success') {
          <i class="bi bi-check-circle-fill text-success" style="font-size: 80px;"></i>
          <h2 class="mt-3">¡Pago exitoso!</h2>
          <p class="text-muted">Tu compra ha sido procesada correctamente.</p>
          <p class="text-muted">Recibirás un correo con los detalles de tu compra y el pago.</p>
        }

        @if (status === 'failure') {
          <i class="bi bi-x-circle-fill text-danger" style="font-size: 80px;"></i>
          <h2 class="mt-3">Pago rechazado</h2>
          <p class="text-muted">No se pudo procesar el pago. Intenta nuevamente.</p>
        }

        @if (status === 'pending') {
          <i class="bi bi-clock-fill text-warning" style="font-size: 80px;"></i>
          <h2 class="mt-3">Pago pendiente</h2>
          <p class="text-muted">Tu pago está siendo procesado. Te notificaremos cuando se confirme.</p>
        }

        <div class="mt-4">
          <a routerLink="/orders" class="btn btn-primary me-2">
            <i class="bi bi-receipt me-1"></i>Ver mis compras
          </a>
          <a routerLink="/products" class="btn btn-outline-secondary">
            <i class="bi bi-shop me-1"></i>Seguir comprando
          </a>
        </div>
      </div>
    </div>
  `
})
export class PaymentResultComponent implements OnInit {
  status = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.status = this.route.snapshot.data['status'] || 'pending';
  }
}
