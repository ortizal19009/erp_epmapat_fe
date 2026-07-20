import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { MobileAppVersion } from 'src/app/modelos/administracion/mobile-app-version.model';
import { MobileAppVersionService } from 'src/app/servicios/administracion/mobile-app-version.service';

@Component({
  selector: 'app-mobile-app-versions',
  templateUrl: './mobile-app-versions.component.html',
  styleUrls: ['./mobile-app-versions.component.css'],
})
export class MobileAppVersionsComponent implements OnInit {
  form!: FormGroup;
  versiones: MobileAppVersion[] = [];
  archivoSeleccionado: File | null = null;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private service: MobileAppVersionService,
    public authService: AutorizaService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      packageName: ['com.erp.epmpatmobile', [Validators.required]],
      versionName: ['', [Validators.required]],
      versionCode: [null, [Validators.required]],
      descripcion: [''],
      forceUpdate: [false],
    });
    this.cargarVersiones();
  }

  cargarVersiones(): void {
    this.service.getAll().subscribe({
      next: (data) => (this.versiones = data || []),
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo cargar el historial de APK.', 'error');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado = input.files && input.files.length ? input.files[0] : null;
  }

  subirApk(): void {
    if (this.form.invalid || !this.archivoSeleccionado) {
      this.form.markAllAsTouched();
      Swal.fire('Falta información', 'Debes seleccionar el APK y completar la versión.', 'warning');
      return;
    }

    const fd = new FormData();
    fd.append('file', this.archivoSeleccionado);
    fd.append('packageName', this.form.value.packageName);
    fd.append('versionName', this.form.value.versionName);
    fd.append('versionCode', String(this.form.value.versionCode));
    fd.append('descripcion', this.form.value.descripcion || '');
    fd.append('forceUpdate', String(!!this.form.value.forceUpdate));
    fd.append('usucrea', String(this.authService.idusuario || 0));

    this.guardando = true;
    this.service.upload(fd).subscribe({
      next: () => {
        this.guardando = false;
        this.archivoSeleccionado = null;
        this.form.patchValue({
          versionName: '',
          versionCode: null,
          descripcion: '',
          forceUpdate: false,
        });
        this.form.markAsPristine();
        this.cargarVersiones();
        Swal.fire('APK cargado', 'La nueva versión quedó publicada para descarga.', 'success');
      },
      error: (err) => {
        this.guardando = false;
        console.error(err);
        Swal.fire('Error', err?.error?.detail || 'No se pudo guardar la versión APK.', 'error');
      },
    });
  }

  descargar(version: MobileAppVersion): void {
    if (!version.id) {
      return;
    }
    window.open(this.service.getDownloadUrl(version.id), '_blank');
  }

  eliminar(version: MobileAppVersion): void {
    if (!version.id) {
      return;
    }

    Swal.fire({
      title: '¿Eliminar versión APK?',
      text: `${version.versionName || 'Sin versión'} (${version.versionCode || '-'})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.service.delete(version.id!).subscribe({
        next: () => {
          this.versiones = this.versiones.filter((item) => item.id !== version.id);
          Swal.fire('Eliminada', 'La versión APK fue eliminada.', 'success');
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', err?.error?.detail || 'No se pudo eliminar la versión APK.', 'error');
        },
      });
    });
  }

  get latestVersion(): MobileAppVersion | null {
    return this.versiones && this.versiones.length ? this.versiones[0] : null;
  }
}
