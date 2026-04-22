import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PdfPaperFormat, PrintBridgeService, PrintProfile, PrinterMode } from 'src/app/servicios/print-bridge.service';
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
  qzPdfScale = 1;
  qzPdfPaperFormat: PdfPaperFormat = 'ticket80';
  qzProfile: PrintProfile = 'consumo';
  qzPrintersAvailable: string[] = [];
  qzLoading = false;
  qzSaving = false;
  qzMessage = '';
  qzMessageClass = 'alert-light border';

  constructor(private qzTrayService: PrintBridgeService) {}

  ngOnInit(): void {
    this.qzProfile = this.qzTrayService.getSavedProfileSelection();
    this.cargarConfiguracion();
    void this.cargarImpresoras();
  }

  cargarConfiguracion(): void {
    const profile = this.qzProfile;
    this.qzPrinterMode = this.qzTrayService.getSavedPrinterMode(profile);
    this.qzPrinterName = this.qzTrayService.getSavedPrinterName(profile);
    this.qzDefaultCopies = this.qzTrayService.getSavedCopies(profile);
    this.qzSilentPrinting = this.qzTrayService.getSilentPrinting(profile);
    this.qzPdfScale = this.qzTrayService.getSavedPdfScale(profile);
    this.qzPdfPaperFormat = this.qzTrayService.getSavedPdfPaperFormat(profile);
  }

  onProfileChange(): void {
    this.qzTrayService.setSavedProfileSelection(this.qzProfile);
    this.cargarConfiguracion();
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
      this.qzMessage = 'No se pudo cargar la lista de impresoras. Verifica que puente local este abierto.';
      this.qzMessageClass = 'alert-warning border';
    } finally {
      this.qzLoading = false;
    }
  }

  onPrinterModeChange(): void {
      this.qzMessage = '';
      this.qzMessageClass = 'alert-light border';
      if (this.qzPrinterMode !== 'manual') {
        this.qzPrinterName = '';
      }
  }

  printerModeLabel(): string {
    if (this.qzPrinterMode === 'tm-t88v') {
      return 'Epson TM-T88V';
    }

    if (this.qzPrinterMode === 'manual') {
      return this.qzPrinterName?.trim() || 'Manual sin definir';
    }

    return 'Automatica';
  }

  pdfScaleLabel(): string {
    return `${this.qzPdfScale.toFixed(2)}x`;
  }

  paperFormatLabel(): string {
    if (this.qzPdfPaperFormat === 'a4') {
      return 'A4';
    }

    if (this.qzPdfPaperFormat === 'ticket58') {
      return 'Ticket 58 mm';
    }

    return 'Ticket 80 mm';
  }

  guardarConfiguracion(): void {
    if (this.qzPrinterMode === 'manual' && !this.qzPrinterName.trim()) {
      Swal.fire('Atencion', 'Selecciona una impresora para el modo manual.', 'warning');
      return;
    }

    this.qzSaving = true;
    try {
      const copies = this.qzTrayService.setDefaultCopies(this.qzDefaultCopies, this.qzProfile);
      this.qzTrayService.setSilentPrinting(this.qzSilentPrinting, this.qzProfile);
      this.qzPdfScale = this.qzTrayService.setPdfScale(this.qzPdfScale, this.qzProfile);
      this.qzPdfPaperFormat = this.qzTrayService.setPdfPaperFormat(this.qzPdfPaperFormat, this.qzProfile);
      this.qzTrayService.setPrinterPreference(this.qzPrinterMode, this.qzPrinterName, this.qzProfile);
      this.qzDefaultCopies = copies;
      this.qzMessage = 'Configuracion guardada correctamente.';
      this.qzMessageClass = 'alert-success border';
      Swal.fire({
        toast: true,
        icon: 'success',
        title: 'Configuracion de impresion guardada.',
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
      await this.qzTrayService.printTestTicket('PRUEBA DE IMPRESION DESDE ADMIN CENTRAL', this.qzProfile);
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
        title: 'No se pudo enviar la prueba de impresion.',
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500,
      });
    }
  }

  volver(): void {
    window.history.back();
  }

  profileLabel(): string {
    switch (this.qzProfile) {
      case 'servicios':
        return 'Servicios';
      case 'convenio':
        return 'Convenio';
      default:
        return 'Consumo de agua';
    }
  }
}


