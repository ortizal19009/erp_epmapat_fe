import { Component, OnInit } from '@angular/core';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { ThFilesService } from 'src/app/servicios/rrhh/th-files.service';

@Component({
  selector: 'app-th-files',
  templateUrl: './th-files.component.html',
  styleUrls: ['./th-files.component.css']
})
export class ThFilesComponent implements OnInit {
  idpersonal = 0;
  personalList: any[] = [];
  files: any[] = [];
  msg = '';
  error = '';

  model: any = {
    idpersonal_personal: { idpersonal: 0 },
    tipo_doc: 'CONTRATO',
    nombre_archivo: '',
    ruta_archivo: '',
    hash_archivo: '',
    version_doc: 1,
    usucrea: 1
  };

  constructor(private personalService: PersonalService, private filesService: ThFilesService) {}

  ngOnInit(): void {
    this.personalService.getAllPersonal().subscribe({
      next: (d: any) => {
        this.personalList = d || [];
        if (this.personalList.length) {
          this.idpersonal = this.personalList[0].idpersonal;
          this.cargar();
        }
      }
    });
  }

  cargar() {
    if (!this.idpersonal) return;
    this.filesService.byPersonal(this.idpersonal).subscribe({
      next: (d: any) => this.files = d || [],
      error: () => this.error = 'No se pudo cargar expediente'
    });
  }

  guardar() {
    this.msg = ''; this.error = '';
    if (!this.model.nombre_archivo || !this.model.ruta_archivo) {
      this.error = 'Nombre y ruta son obligatorios';
      return;
    }
    this.model.idpersonal_personal = { idpersonal: this.idpersonal };
    this.filesService.save(this.model).subscribe({
      next: () => {
        this.msg = 'Documento registrado';
        this.model.nombre_archivo = '';
        this.model.ruta_archivo = '';
        this.model.hash_archivo = '';
        this.cargar();
      },
      error: (e) => this.error = e?.error?.message || 'No se pudo registrar documento'
    });
  }
}
