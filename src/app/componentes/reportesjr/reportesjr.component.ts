import { Component, OnInit } from '@angular/core';
import { ReportejrService } from 'src/app/servicios/reportejr.service';

@Component({
  selector: 'app-reportesjr',
  templateUrl: './reportesjr.component.html',
  styleUrls: ['./reportesjr.component.css'],
})
export class ReportesjrComponent implements OnInit {
  nombreReporte: string = '';
  selectedFile: File | null = null;
  mensaje: string = '';

  constructor(private reporteService: ReportejrService) {}

  ngOnInit(): void {}
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }
  onUpload() {
    if (this.nombreReporte && this.selectedFile) {
      this.reporteService
        .uploadReporte(this.nombreReporte, this.selectedFile)
        .subscribe({
          next: (res) => (this.mensaje = res),
          error: (err) => (this.mensaje = 'Error al subir el reporte'),
        });
    } else {
      this.mensaje = 'Debe ingresar un nombre y seleccionar un archivo';
    }
  }
}
