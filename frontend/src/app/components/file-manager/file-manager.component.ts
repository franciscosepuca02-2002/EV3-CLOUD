import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-file-manager',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2 class="mb-4"><i class="bi bi-folder2-open me-2"></i>Mis Archivos</h2>

    @if (message) {
      <div class="alert" [class]="messageType === 'error' ? 'alert-danger' : 'alert-success'">
        {{ message }}
      </div>
    }

    <!-- Storage Info -->
    @if (storage) {
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <h5 class="card-title"><i class="bi bi-hdd me-2"></i>Espacio de Almacenamiento</h5>
          <div class="progress mb-2" style="height: 24px;">
            <div class="progress-bar"
                 [class]="storage.percentage_used > 80 ? 'bg-danger' : storage.percentage_used > 50 ? 'bg-warning' : 'bg-success'"
                 [style.width.%]="storage.percentage_used">
              {{ storage.percentage_used }}%
            </div>
          </div>
          <div class="d-flex justify-content-between text-muted small">
            <span><i class="bi bi-database me-1"></i>Usado: {{ storage.used_formatted }}</span>
            <span><i class="bi bi-check-circle me-1"></i>Disponible: {{ storage.available_formatted }}</span>
            <span><i class="bi bi-hdd me-1"></i>Límite: {{ storage.limit_formatted }}</span>
          </div>
        </div>
      </div>
    }

    <!-- Upload -->
    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <h5 class="card-title"><i class="bi bi-cloud-arrow-up me-2"></i>Subir Archivo</h5>
        <div class="input-group">
          <input type="file" class="form-control" (change)="onFileSelected($event)" #fileInput>
          <button class="btn btn-primary" (click)="upload()" [disabled]="!selectedFile || uploading">
            <i class="bi bi-upload me-1"></i>
            {{ uploading ? 'Subiendo...' : 'Subir' }}
          </button>
        </div>
        @if (selectedFile) {
          <small class="text-muted mt-1 d-block">
            Archivo: {{ selectedFile.name }} ({{ formatBytes(selectedFile.size) }})
          </small>
        }
      </div>
    </div>

    <!-- File List -->
    <div class="card shadow-sm">
      <div class="card-body">
        <h5 class="card-title"><i class="bi bi-files me-2"></i>Archivos Almacenados ({{ files.length }})</h5>

        @if (files.length === 0) {
          <p class="text-muted text-center py-3">No tienes archivos subidos</p>
        } @else {
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Archivo</th>
                  <th>Tipo</th>
                  <th class="text-end">Tamaño</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (file of files; track file.id) {
                  <tr>
                    <td class="align-middle">
                      <i [class]="getFileIcon(file.content_type)" class="me-2"></i>
                      {{ file.file_name }}
                    </td>
                    <td class="align-middle text-muted small">{{ file.content_type }}</td>
                    <td class="align-middle text-end">{{ file.file_size_formatted }}</td>
                    <td class="align-middle text-muted small">{{ file.uploaded_at | date:'dd/MM/yy HH:mm' }}</td>
                    <td class="text-end align-middle">
                      <button class="btn btn-outline-danger btn-sm" (click)="deleteFile(file.id)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class FileManagerComponent implements OnInit {
  files: any[] = [];
  storage: any = null;
  selectedFile: File | null = null;
  uploading = false;
  message = '';
  messageType = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadFiles();
    this.loadStorage();
  }

  loadFiles() {
    this.api.getFiles().subscribe({
      next: (data) => this.files = data,
      error: () => this.showMsg('Error cargando archivos', 'error')
    });
  }

  loadStorage() {
    this.api.getStorageInfo().subscribe({
      next: (data) => this.storage = data,
      error: () => console.error('Error cargando storage')
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] || null;
  }

  upload() {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.message = '';

    this.api.uploadFile(this.selectedFile).subscribe({
      next: (res) => {
        this.showMsg(`Archivo "${res.file_name}" subido exitosamente. Disponible: ${res.space_available_formatted}`, 'success');
        this.selectedFile = null;
        this.uploading = false;
        this.loadFiles();
        this.loadStorage();
      },
      error: (err) => {
        this.showMsg(err.error?.detail || 'Error subiendo archivo', 'error');
        this.uploading = false;
      }
    });
  }

  deleteFile(fileId: number) {
    if (!confirm('¿Eliminar este archivo?')) return;
    this.api.deleteFile(fileId).subscribe({
      next: () => {
        this.showMsg('Archivo eliminado', 'success');
        this.loadFiles();
        this.loadStorage();
      },
      error: () => this.showMsg('Error eliminando archivo', 'error')
    });
  }

  formatBytes(bytes: number): string {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(2) + ' KB';
  }

  getFileIcon(contentType: string): string {
    if (!contentType) return 'bi bi-file-earmark';
    if (contentType.startsWith('image/')) return 'bi bi-file-earmark-image text-success';
    if (contentType.includes('pdf')) return 'bi bi-file-earmark-pdf text-danger';
    if (contentType.includes('word') || contentType.includes('document')) return 'bi bi-file-earmark-word text-primary';
    if (contentType.includes('sheet') || contentType.includes('excel')) return 'bi bi-file-earmark-excel text-success';
    if (contentType.includes('zip') || contentType.includes('rar')) return 'bi bi-file-earmark-zip text-warning';
    return 'bi bi-file-earmark text-secondary';
  }

  private showMsg(msg: string, type: string) {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 5000);
  }
}
