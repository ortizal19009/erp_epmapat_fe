import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { StorageService } from 'src/app/servicios/storage.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css'],
})
export class FileUploadComponent implements OnChanges {
  @Input() folder = 'general';
  @Input() entidadId!: number;
  @Input() accept = 'image/*,application/pdf';
  @Input() buttonLabel = 'Seleccionar archivo';
  @Input() currentRoute: string | null = null;

  @Output() uploaded = new EventEmitter<string>();

  preview: string | null = null;
  progress = 0;
  ruta = '';
  archivo = '';
  uploading = false;

  constructor(private storage: StorageService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentRoute'] && this.currentRoute) {
      this.ruta = this.currentRoute;
      this.archivo = this.getFileName(this.currentRoute);
      this.preview = this.resolvePreview(this.currentRoute);
    }
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.entidadId) return;

    this.archivo = file.name;
    this.progress = 0;
    this.uploading = true;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.preview = (e.target?.result as string) || null;
      };
      reader.readAsDataURL(file);
    } else {
      this.preview = null;
    }

    this.storage.upload(file, this.folder, this.entidadId).subscribe({
      next: (e) => {
        if (e.type === HttpEventType.UploadProgress) {
          this.progress = Math.round((100 * e.loaded) / (e.total ?? 1));
        }

        if (e.type === HttpEventType.Response) {
          this.uploading = false;
          this.progress = 100;
          this.ruta = e.body?.ruta ?? '';
          this.archivo = e.body?.archivo ?? this.archivo;
          if (this.ruta && !file.type.startsWith('image/')) {
            this.preview = null;
          }
          this.uploaded.emit(this.ruta);
        }
      },
      error: (err) => {
        console.error('Error al subir archivo:', err);
        this.uploading = false;
      },
    });
  }

  get previewUrl(): string | null {
    if (!this.ruta) return this.preview;
    if (this.preview?.startsWith('data:image/')) return this.preview;
    return this.resolvePreview(this.ruta);
  }

  private resolvePreview(ruta: string): string {
    if (/^(https?:|data:|blob:)/i.test(ruta)) return ruta;
    return this.storage.viewUrl(ruta);
  }

  private getFileName(ruta: string): string {
    const normalized = ruta.replace(/\\/g, '/');
    return normalized.split('/').pop() || ruta;
  }
}
