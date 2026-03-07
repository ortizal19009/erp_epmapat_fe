import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ErpmodulosService } from 'src/app/servicios/administracion/erpmodulos.service';
import { UsrxmodulosService } from 'src/app/servicios/administracion/usrxmodulos.service';

@Component({
  standalone: true,
  selector: 'app-access-admin',
  templateUrl: './access-admin.html',
  styleUrls: ['./access-admin.css'],
  imports: [CommonModule, FormsModule],
})
export class AccessAdminComponent implements OnInit {
  adminNewModulo = { descripcion: '', platform: 'WEB' };
  allModules: any[] = [];
  selectedModuleId: number | null = null;
  sectionCatalog: any[] = [];
  adminNewSection: any = { codigo: '', descripcion: '', ruta: '', orden: 0, platform: 'WEB', activo: true };

  constructor(
    public auth: AutorizaService,
    private router: Router,
    private erpmodulos: ErpmodulosService,
    private usrxmodulos: UsrxmodulosService,
  ) {}

  ngOnInit(): void {
    if (this.auth.idusuario !== 1) {
      this.router.navigate(['/inicio']);
      return;
    }
    this.loadAllModulesCatalog();
  }

  loadAllModulesCatalog() {
    this.erpmodulos.getAllErpModulos().subscribe({
      next: (mods: any[]) => {
        this.allModules = mods || [];
        if (this.selectedModuleId == null && this.allModules.length > 0) {
          this.selectedModuleId = this.allModules[0].iderpmodulo;
          this.loadSectionCatalog();
        }
      },
      error: (e: any) => console.error(e),
    });
  }

  saveNewModulo() {
    if (!this.adminNewModulo.descripcion?.trim()) return;
    const payload = {
      descripcion: this.adminNewModulo.descripcion.trim(),
      platform: (this.adminNewModulo.platform || 'WEB').toUpperCase(),
    };
    this.erpmodulos.save(payload).subscribe({
      next: () => {
        this.adminNewModulo = { descripcion: '', platform: 'WEB' };
        this.loadAllModulesCatalog();
      },
      error: (e: any) => console.error(e),
    });
  }

  saveModuloEdit(m: any) {
    this.erpmodulos.update(m.iderpmodulo, {
      descripcion: m.descripcion,
      platform: (m.platform || 'WEB').toUpperCase(),
    }).subscribe({
      next: () => this.loadAllModulesCatalog(),
      error: (e: any) => console.error(e),
    });
  }

  loadSectionCatalog() {
    if (!this.selectedModuleId) {
      this.sectionCatalog = [];
      return;
    }
    this.usrxmodulos.getSectionCatalog(this.selectedModuleId, 'ALL').subscribe({
      next: (rows: any[]) => this.sectionCatalog = rows || [],
      error: (e: any) => console.error(e),
    });
  }

  saveNewSectionCatalog() {
    if (!this.selectedModuleId) return;
    if (!this.adminNewSection.codigo?.trim() || !this.adminNewSection.descripcion?.trim()) return;
    const payload = {
      iderpmodulo: this.selectedModuleId,
      codigo: this.adminNewSection.codigo.trim(),
      descripcion: this.adminNewSection.descripcion.trim(),
      ruta: this.adminNewSection.ruta?.trim() || null,
      orden: +this.adminNewSection.orden || 0,
      platform: (this.adminNewSection.platform || 'WEB').toUpperCase(),
      activo: !!this.adminNewSection.activo,
    };
    this.usrxmodulos.saveSectionCatalog(payload).subscribe({
      next: () => {
        this.adminNewSection = { codigo: '', descripcion: '', ruta: '', orden: 0, platform: 'WEB', activo: true };
        this.loadSectionCatalog();
      },
      error: (e: any) => console.error(e),
    });
  }

  saveSectionEdit(sec: any) {
    this.usrxmodulos.updateSectionCatalog(sec.iderpseccion, {
      codigo: sec.codigo,
      descripcion: sec.descripcion,
      ruta: sec.ruta,
      orden: +sec.orden || 0,
      platform: (sec.platform || 'WEB').toUpperCase(),
      activo: !!sec.activo,
    }).subscribe({
      next: () => this.loadSectionCatalog(),
      error: (e: any) => console.error(e),
    });
  }
}
