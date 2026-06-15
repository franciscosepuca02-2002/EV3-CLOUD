import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="row justify-content-center" style="margin-top: 8vh;">
      <div class="col-md-6 col-lg-5 text-center">
        <div class="card border-0 shadow-sm p-5" style="border-radius: 20px;">

          @if (status === 'success') {
            <div style="background: #ecfdf5; border-radius: 50%; width: 100px; height: 100px; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
              <i class="bi bi-check-lg" style="font-size: 50px; color: #10b981;"></i>
            </div>
            <h2 class="fw-bold">¡Pago exitoso!</h2>
            <p class="text-muted mt-2">Tu compra ha sido procesada correctamente.</p>
            <p class="text-muted">Recibirás un correo con los detalles de tu compra y el pago.</p>
          }

          @if (status === 'failure') {
            <div style="background: #fef2f2; border-radius: 50%; width: 100px; height: 100px; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
              <i class="bi bi-x-lg" style="font-size: 50px; color: #ef4444;"></i>
            </div>
            <h2 class="fw-bold">Pago rechazado</h2>
            <p class="text-muted mt-2">No se pudo procesar el pago. Intenta nuevamente.</p>
          }

          @if (status === 'pending') {
            <div style="background: #fefce8; border-radius: 50%; width: 100px; height: 100px; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
              <i class="bi bi-clock" style="font-size: 50px; color: #f59e0b;"></i>
            </div>
            <h2 class="fw-bold">Pago pendiente</h2>
            <p class="text-muted mt-2">Tu pago está siendo procesado. Te notificaremos cuando se confirme.</p>
          }

          <div class="d-flex justify-content-center gap-3 mt-4">
            <a routerLink="/orders" class="btn btn-primary px-4" style="border-radius: 10px;">
              <i class="bi bi-receipt me-1"></i>Ver mis compras
            </a>
            <a routerLink="/products" class="btn btn-outline-secondary px-4" style="border-radius: 10px;">
              <i class="bi bi-shop me-1"></i>Seguir comprando
            </a>
          </div>
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
