import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-title">
      <i class="bi bi-shop"></i>
      <span>Productos</span>
      <span class="badge rounded-pill ms-2" style="background: var(--ev3-border); color: var(--ev3-muted); font-size: 0.75rem;">{{ products.length }} items</span>
    </div>

    @if (message) {
      <div class="alert alert-success d-flex align-items-center justify-content-between" style="animation: slideDown 0.3s ease;">
        <span><i class="bi bi-check-circle me-2"></i>{{ message }}</span>
        <button type="button" class="btn-close btn-sm" (click)="message = ''"></button>
      </div>
    }

    <div class="row g-4">
      @for (product of products; track product.id) {
        <div class="col-md-4 col-lg-3">
          <div class="card h-100 border-0 product-card" style="border-radius: 16px; overflow: hidden;">
            <div style="position: relative; overflow: hidden;">
              <img [src]="product.image_url" class="card-img-top" [alt]="product.name"
                   style="height: 190px; object-fit: cover; transition: transform 0.3s ease;">
              @if (product.stock <= 5 && product.stock > 0) {
                <span class="badge" style="position: absolute; top: 12px; right: 12px; background: var(--ev3-warning); font-size: 0.7rem;">
                  ¡Quedan {{ product.stock }}!
                </span>
              }
              @if (product.stock === 0) {
                <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
                  <span class="badge bg-dark" style="font-size: 0.85rem;">Agotado</span>
                </div>
              }
            </div>
            <div class="card-body d-flex flex-column p-3">
              <h6 class="fw-bold mb-1" style="font-size: 0.95rem;">{{ product.name }}</h6>
              <p class="text-muted mb-2" style="font-size: 0.8rem; line-height: 1.4;">{{ product.description }}</p>
              <div class="mt-auto">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="fw-bold" style="font-size: 1.2rem; background: var(--ev3-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    \${{ product.price | number:'1.0-0' }}
                  </span>
                  <span class="text-muted" style="font-size: 0.75rem;">
                    <i class="bi bi-box-seam me-1"></i>{{ product.stock }} disp.
                  </span>
                </div>
                <button class="btn btn-primary w-100" style="border-radius: 10px; font-size: 0.88rem;"
                        (click)="addToCart(product)"
                        [disabled]="product.stock === 0">
                  <i class="bi bi-cart-plus me-1"></i>
                  {{ product.stock === 0 ? 'Sin stock' : 'Agregar' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .product-card {
      transition: all 0.3s ease;
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.1);
    }
    .product-card:hover img {
      transform: scale(1.05);
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  message = '';

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.api.getProducts().subscribe({
      next: (data) => this.products = data,
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  addToCart(product: any) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.api.addToCart(product.id).subscribe({
      next: () => this.message = `"${product.name}" agregado al carrito`,
      error: (err) => this.message = err.error?.detail || 'Error al agregar'
    });
  }
}
