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
    <h2 class="mb-4"><i class="bi bi-shop me-2"></i>Productos</h2>

    @if (message) {
      <div class="alert alert-success alert-dismissible fade show">
        {{ message }}
        <button type="button" class="btn-close" (click)="message = ''"></button>
      </div>
    }

    <div class="row">
      @for (product of products; track product.id) {
        <div class="col-md-4 col-lg-3 mb-4">
          <div class="card h-100 shadow-sm">
            <img [src]="product.image_url" class="card-img-top" [alt]="product.name" style="height: 180px; object-fit: cover;">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">{{ product.name }}</h5>
              <p class="card-text text-muted small">{{ product.description }}</p>
              <div class="mt-auto">
                <p class="fw-bold text-primary fs-5 mb-2">\${{ product.price | number:'1.0-0' }}</p>
                <p class="text-muted small mb-2">Stock: {{ product.stock }}</p>
                <button class="btn btn-primary w-100"
                        (click)="addToCart(product)"
                        [disabled]="product.stock === 0">
                  <i class="bi bi-cart-plus me-1"></i>
                  {{ product.stock === 0 ? 'Sin stock' : 'Agregar al carrito' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
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
