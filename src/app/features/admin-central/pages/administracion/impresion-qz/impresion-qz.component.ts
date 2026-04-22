import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QzTrayService } from 'src/app/servicios/qz-tray.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-impresion-qz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './impresion-qz.component.html',
  styleUrls: ['./impresion-qz.component.css'],
})
export class ImpresionQzComponent implements OnInit {
  qzPrinterMode: 'auto' | 'tm-t88v' | 'manual' = 'auto';
  qzPrinterName = '';
  qzDefaultCopies = 2;
  qzSilentPrinting = true;
  qzPrintersAvailable: string[] = [];
  qzLoading = false;
  qzSaving = false;
  qzMessage = '';
  qzMessageClass = 'alert-light border';

  constructor(private qzTrayService: QzTrayService) {}

  ngOnInit(): void {
    this.cargarConfiguracion();
  }

  cargarConfiguracion(): void {
    this.qzPrinterMode = this.qzTrayService.getSavedPrinterMode();
    this.qzPrinterName = this.qzTrayService.getSavedPrinterName();
    this.qzDefaultCopies = this.qzTrayService.getSavedCopies();
    this.qzSilentPrinting = this.qzTrayService.getSilentPrinting();

    if (this.qzPrinterMode === 'manual') {
      void this.cargarImpresoras();
    }
  }

  async cargarImpresoras(): Promise<void> {
    this.qzLoading = true;
    this.qzMessage = '';

    try {
      this.qzPrintersAvailable = await this.qzTrayService.listPrinters();
      if (this.qzPrinterMode === 'manual' && !this.qzPrinterName && this.qzPrintersAvailable.length) {
        this.qzPrinterName = this.qzPrintersAvailable[0];
      }
    } catch (error) {
      console.error(error);
      this.qzMessage = 'No se pudo cargar la lista de impresoras. Verifica que QZ Tray esté abierto.';
      this.qzMessageClass = 'alert-warning border';
    } finally {
      this.qzLoading = false;
    }
  }

  onPrinterModeChange(): void {
    this.qzMessage = '';
    this.qzMessageClass = 'alert-light border';

    if (this.qzPrinterMode === 'manual') {
      void this.cargarImpresoras();
      return;
    }

    this.qzPrinterName = '';
  }

  guardarConfiguracion(): void {
    if (this.qzPrinterMode === 'manual' && !this.qzPrinterName.trim()) {
      Swal.fire('Atención', 'Selecciona una impresora para el modo manual.', 'warning');
      return;
    }

    this.qzSaving = true;
    try {
      const copies = this.qzTrayService.setDefaultCopies(this.qzDefaultCopies);
      this.qzTrayService.setSilentPrinting(this.qzSilentPrinting);
      this.qzTrayService.setPrinterPreference(this.qzPrinterMode, this.qzPrinterName);
      this.qzDefaultCopies = copies;
      this.qzMessage = 'Configuración guardada correctamente.';
      this.qzMessageClass = 'alert-success border';
      Swal.fire({
        toast: true,
        icon: 'success',
        title: 'Configuración de impresión guardada.',
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
      });
    } finally {
      this.qzSaving = false;
    }
  }

  async probarImpresora(): Promise<void> {
    try {
      await this.qzTrayService.printTestTicket('PRUEBA DE IMPRESION DESDE ADMIN CENTRAL');
      Swal.fire({
        toast: true,
        icon: 'success',
        title: 'Prueba enviada a la impresora.',
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        toast: true,
        icon: 'error',
        title: 'No se pudo enviar la prueba de impresión.',
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500,
      });
    }
  }

  volver(): void {
    window.history.back();
  }
}
