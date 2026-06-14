import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent) },
  { path: 'verify', loadComponent: () => import('./components/verify/verify.component').then(m => m.VerifyComponent) },
  { path: 'products', loadComponent: () => import('./components/products/products.component').then(m => m.ProductsComponent) },
  { path: 'cart', loadComponent: () => import('./components/cart/cart.component').then(m => m.CartComponent), canActivate: [authGuard] },
  { path: 'orders', loadComponent: () => import('./components/orders/orders.component').then(m => m.OrdersComponent), canActivate: [authGuard] },
  { path: 'files', loadComponent: () => import('./components/file-manager/file-manager.component').then(m => m.FileManagerComponent), canActivate: [authGuard] },
  { path: 'payment/success', loadComponent: () => import('./components/payment-result/payment-result.component').then(m => m.PaymentResultComponent), data: { status: 'success' } },
  { path: 'payment/failure', loadComponent: () => import('./components/payment-result/payment-result.component').then(m => m.PaymentResultComponent), data: { status: 'failure' } },
  { path: 'payment/pending', loadComponent: () => import('./components/payment-result/payment-result.component').then(m => m.PaymentResultComponent), data: { status: 'pending' } },
  { path: '**', redirectTo: '/products' }
];
