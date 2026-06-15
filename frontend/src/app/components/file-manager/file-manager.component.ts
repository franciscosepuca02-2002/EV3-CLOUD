import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-file-manager',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-title">
      <i class="bi bi-folder2-open"></i>
      <span>Mis Archivos</span>
    </div>

    @if (message) {
      <div class="alert d-flex align-items-center" [class]="messageType === 'error' ? 'alert-danger' : 'alert-success'" style="animation: slideDown 0.3s ease;">
        <i [class]="messageType === 'error' ? 'bi bi-exclamation-circle' : 'bi bi-check-circle'" class="me-2"></i>{{ message }}
      </div>
    }

    <!-- Storage Info -->
    @if (storage) {
      <div class="card border-0 shadow-sm mb-4" style="border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 24px; color: white;">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="mb-0 fw-bold"><i class="bi bi-hdd me-2"></i>Almacenamiento</h6>
            <span class="badge" style="background: rgba(255,255,255,0.15); font-size: 0.85rem; padding: 6px 14px;">
              {{ storage.percentage_used }}% usado
            </span>
          </div>
          <div class="progress mb-3" style="height: 10px; background: rgba(255,255,255,0.15);">
            <div class="progress-bar"
                 [style.width.%]="storage.percentage_used"
                 [style.background]="storage.percentage_used > 80 ? '#ef4444' : storage.percentage_used > 50 ? '#f59e0b' : 'linear-gradient(90deg, #818cf8, #06b6d4)'">
            </div>
          </div>
          <div class="d-flex justify-content-between" style="font-size: 0.85rem; opacity: 0.8;">
            <span><i class="bi bi-database me-1"></i>Usado: {{ storage.used_formatted }}</span>
            <span><i class="bi bi-check-circle me-1"></i>Disponible: {{ storage.available_formatted }}</span>
            <span><i class="bi bi-hdd me-1"></i>Límite: {{ storage.limit_formatted }}</span>
          </div>
        </div>
      </div>
    }

    <!-- Upload Area -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 16px;">
      <div class="card-body p-4">
        <h6 class="fw-bold mb-3"><i class="bi bi-cloud-arrow-up me-2" style="color: var(--ev3-primary);"></i>Subir Archivo</h6>
        <div style="border: 2px dashed var(--ev3-border); border-radius: 12px; padding: 24px; text-align: center; background: #fafbfc; transition: all 0.2s;">
          <i class="bi bi-file-earmark-arrow-up" style="font-size: 2rem; color: var(--ev3-primary); opacity: 0.6;"></i>
          <p class="text-muted mt-2 mb-3" style="font-size: 0.9rem;">Selecciona un archivo para subir a tu nube</p>
          <div class="d-flex justify-content-center gap-2 align-items-center flex-wrap">
            <input type="file" class="form-control" (change)="onFileSelected($event)" #fileInput style="max-width: 300px; border-radius: 10px;">
            <button class="btn btn-primary px-4" (click)="upload()" [disabled]="!selectedFile || uploading" style="border-radius: 10px;">
              @if (uploading) {
                <span class="spinner-border spinner-border-sm me-1"></span>Subiendo...
              } @else {
                <i class="bi bi-upload me-1"></i>Subir
              }
            </button>
          </div>
          @if (selectedFile) {
            <div class="mt-2" style="font-size: 0.85rem; color: var(--ev3-muted);">
              <i class="bi bi-file-earmark me-1"></i>{{ selectedFile.name }} <span class="text-muted">({{ formatBytes(selectedFile.size) }})</span>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- File List -->
    <div class="card border-0 shadow-sm" style="border-radius: 16px;">
      <div class="card-body p-4">
        <h6 class="fw-bold mb-3">
          <i class="bi bi-files me-2" style="color: var(--ev3-primary);"></i>Archivos Almacenados
          <span class="badge rounded-pill ms-1" style="background: var(--ev3-border); color: var(--ev3-muted); font-size: 0.75rem;">{{ files.length }}</span>
        </h6>

        @if (files.length === 0) {
          <div class="text-center py-4">
            <i class="bi bi-inbox" style="font-size: 3rem; color: #cbd5e1;"></i>
            <p class="text-muted mt-2">No tienes archivos subidos</p>
          </div>
        } @else {
          <div class="d-flex flex-column gap-2">
            @for (file of files; track file.id) {
              <div class="d-flex align-items-center p-3" style="background: #f8fafc; border-radius: 10px; transition: all 0.2s;">
                <div style="width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;"
                     [style.background]="getFileBg(file.content_type)">
                  <i [class]="getFileIcon(file.content_type)"></i>
                </div>
                <div class="ms-3 flex-grow-1">
                  <div class="fw-medium" style="font-size: 0.9rem;">{{ file.file_name }}</div>
                  <div class="text-muted" style="font-size: 0.78rem;">{{ file.file_size_formatted }} · {{ file.uploaded_at | date:'dd/MM/yy HH:mm' }}</div>
                </div>
                <button class="btn btn-sm" style="background: #fef2f2; color: var(--ev3-danger); border-radius: 8px;" (click)="deleteFile(file.id)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class FileManagerComponent implements OnInit {
  files: any[] = [];
  storage: any = null;
  selectedFile: File | null = null;
  uploading = false;
  message = '';
  messageType = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadFiles(); this.loadStorage(); }

  loadFiles() { this.api.getFiles().subscribe({ next: (data) => this.files = data, error: () => this.showMsg('Error cargando archivos', 'error') }); }
  loadStorage() { this.api.getStorageInfo().subscribe({ next: (data) => this.storage = data, error: () => console.error('Error cargando storage') }); }
  onFileSelected(event: any) { this.selectedFile = event.target.files[0] || null; }

  upload() {
    if (!this.selectedFile) return;
    this.uploading = true; this.message = '';
    this.api.uploadFile(this.selectedFile).subscribe({
      next: (res) => { this.showMsg(`Archivo "${res.file_name}" subido exitosamente. Disponible: ${res.space_available_formatted}`, 'success'); this.selectedFile = null; this.uploading = false; this.loadFiles(); this.loadStorage(); },
      error: (err) => { this.showMsg(err.error?.detail || 'Error subiendo archivo', 'error'); this.uploading = false; }
    });
  }

  deleteFile(fileId: number) {
    if (!confirm('¿Eliminar este archivo?')) return;
    this.api.deleteFile(fileId).subscribe({ next: () => { this.showMsg('Archivo eliminado', 'success'); this.loadFiles(); this.loadStorage(); }, error: () => this.showMsg('Error eliminando archivo', 'error') });
  }

  formatBytes(bytes: number): string {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(2) + ' KB';
  }

  getFileIcon(ct: string): string {
    if (!ct) return 'bi bi-file-earmark';
    if (ct.startsWith('image/')) return 'bi bi-file-earmark-image';
    if (ct.includes('pdf')) return 'bi bi-file-earmark-pdf';
    if (ct.includes('word') || ct.includes('document')) return 'bi bi-file-earmark-word';
    if (ct.includes('sheet') || ct.includes('excel')) return 'bi bi-file-earmark-excel';
    if (ct.includes('zip') || ct.includes('rar')) return 'bi bi-file-earmark-zip';
    return 'bi bi-file-earmark';
  }

  getFileBg(ct: string): string {
    if (!ct) return '#f1f5f9';
    if (ct.startsWith('image/')) return '#ecfdf5';
    if (ct.includes('pdf')) return '#fef2f2';
    if (ct.includes('word') || ct.includes('document')) return '#eff6ff';
    if (ct.includes('sheet') || ct.includes('excel')) return '#ecfdf5';
    if (ct.includes('zip') || ct.includes('rar')) return '#fefce8';
    return '#f1f5f9';
  }

  private showMsg(msg: string, type: string) { this.message = msg; this.messageType = type; setTimeout(() => this.message = '', 5000); }
}
