import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  // ---- Auth ----
  register(data: { email: string; password: string; full_name: string; phone: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, data);
  }

  verify(data: { email: string; code: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/verify`, data);
  }

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, data);
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/me`, { headers: this.authHeaders() });
  }

  // ---- Products ----
  getProducts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/products/`);
  }

  // ---- Cart ----
  getCart(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cart/`, { headers: this.authHeaders() });
  }

  addToCart(productId: number, quantity: number = 1): Observable<any> {
    return this.http.post(`${this.baseUrl}/cart/add`, { product_id: productId, quantity }, { headers: this.authHeaders() });
  }

  removeFromCart(itemId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/${itemId}`, { headers: this.authHeaders() });
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/`, { headers: this.authHeaders() });
  }

  // ---- Orders ----
  createOrder(): Observable<any> {
    return this.http.post(`${this.baseUrl}/orders/create`, {}, { headers: this.authHeaders() });
  }

  getOrders(): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders/`, { headers: this.authHeaders() });
  }

  getOrder(orderId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders/${orderId}`, { headers: this.authHeaders() });
  }

  // ---- Payments ----
  createCheckout(orderId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments/create-checkout/${orderId}`, {}, { headers: this.authHeaders() });
  }

  pagoDirecto(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments/directo`, data, { headers: this.authHeaders() });
  }

  // ---- Files ----
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/files/upload`, formData, { headers: this.authHeaders() });
  }

  getFiles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/files/`, { headers: this.authHeaders() });
  }

  getStorageInfo(): Observable<any> {
    return this.http.get(`${this.baseUrl}/files/storage`, { headers: this.authHeaders() });
  }

  deleteFile(fileId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/files/${fileId}`, { headers: this.authHeaders() });
  }
}
