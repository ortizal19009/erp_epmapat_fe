import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { Reportesjr } from '@modelos/administracion/reportesjr.model';
import { ReportesjrService } from '@servicios/administracion/reportesjr.service';
import { RepoxopcionService } from '@servicios/administracion/repoxopcion.service';
import { map, of } from 'rxjs';

@Component({
  selector: 'app-modi-reportejr',
  templateUrl: './modi-reportejr.component.html',
  styleUrls: ['./modi-reportejr.component.css']
})

export class ModiReportejrComponent implements OnInit {

  idreporte!: number;
  formReportejr!: FormGroup;
  idrepoxopcion: number | null = null;
  reportejr!: any;
  _repoxopcion: any[] = [];
  jrxmlFile: File | null = null;
  jasperFile: File | null = null;
  fileLabel!: string;
  nomrep!: string;
  antnomrep!: string;
  swactualizando: boolean = false;

  constructor(public router: Router, public fb: FormBuilder, public authService: AutorizaService,
    private repoxopService: RepoxopcionService, private repojrService: ReportesjrService) { }

  ngOnInit(): void {
    if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
    sessionStorage.setItem('ventana', '/reportesjr');
    let coloresJSON = sessionStorage.getItem('/reportesjr');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    const reportejrJSON = sessionStorage.getItem('reportejrToModi');
    if (reportejrJSON) {
      this.reportejr = JSON.parse(reportejrJSON);
      this.idreporte = this.reportejr.idreporte!;
      this.nomrep = this.reportejr.nomrep;
      this.antnomrep = this.nomrep;

      const jrxmlBase64 = this.reportejr.jrxml!;
      const xmlString = decodeBase64ToXml(jrxmlBase64);
      const nombreReporte = extractReportNameFromJrxml(xmlString);

      this.idrepoxopcion = this.reportejr.repoxopcion!.idrepoxopcion;
      this.formReportejr = this.fb.group({
        repoxopcion: [this.reportejr.repoxopcion.codigo, [Validators.required], [this.valRepoxopcion.bind(this)]],
        nombre: [this.reportejr.repoxopcion?.nombre, Validators.required],
        jrxml: nombreReporte,
        archivos: [null],
        nomrep: [this.reportejr.nomrep, Validators.required, [this.valNomrep.bind(this)]],
        metodo: this.reportejr.metodo,
        desrep: [this.reportejr.desrep, Validators.required],

        usumodi: this.authService.idusuario,
        fecmodi: new Date(),
      },
        { updateOn: "blur" }
      );
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1')
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  get f() { return this.formReportejr.controls; }

  //Datalist de Repoxopcion
  datalistRepoxopcion(e: any) {
    if (e.target.value != '') {
      this.repoxopService.datalist(e.target.value).subscribe({
        next: datos => this._repoxopcion = datos,
        error: err => {
          console.error(err.error);
          this.authService.mostrarError('Error al buscar en Repoxopcion', err.error);
        },
      });
    }
  }
  onRepoxopcionSelected(e: any) {
    const selectedOption = this._repoxopcion.find((x: { codigo: any; }) => x.codigo === e.target.value);
    if (selectedOption) {
      this.idrepoxopcion = selectedOption.idrepoxopcion;
      console.log('this.idrepoxopcion: ', this.idrepoxopcion)
      this.formReportejr.controls['nombre'].setValue(selectedOption.nombre);
    } else {
      this.formReportejr.controls['nombre'].setValue('');
      this.idrepoxopcion = null;
    }
  }

  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    this.jrxmlFile = null;
    this.jasperFile = null;
    const selectedNames: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      selectedNames.push(file.name);

      if (ext === 'jrxml') {
        this.jrxmlFile = file;

        // Extrae nombre base sin extensión
        const nomrepSinExtension = file.name.replace(/\.[^/.]+$/, '');

        // Asigna automáticamente al campo nomrep
        const control = this.formReportejr.get('nomrep');
        control?.setValue(nomrepSinExtension, { emitEvent: true });
        control?.markAsTouched();
        control?.updateValueAndValidity({ onlySelf: true });
      }

      else if (ext === 'jasper') {
        this.jasperFile = file;
      }
    }

    this.fileLabel = selectedNames.join(', ');

    // Actualiza el control 'archivos' con ambos archivos
    this.formReportejr.get('archivos')?.setValue({
      jrxml: this.jrxmlFile,
      jasper: this.jasperFile
    });
    this.formReportejr.get('archivos')?.markAsTouched();
    this.formReportejr.get('archivos')?.updateValueAndValidity();
  }

  regresar() { this.router.navigate(['/reportesjr']); }

  actualizar() {
    if (this.jrxmlFile == null || this.jasperFile == null) {
      this.actualizarMetadatos();
    } else {
      this.axtualizarCompleto();
    }
  }

  // A actualiza solo los metadatos, sin archivos
  actualizarMetadatos() {
    // console.log('this.formReportejr.value.metodo: ', this.formReportejr.value.metodo)
    this.repojrService.actualizarMetadatos(this.idreporte, {
      idrepoxopcion: this.idrepoxopcion!,
      nomrep: this.formReportejr.value.nomrep,
      metodo: this.formReportejr.value.metodo,
      desrep: this.formReportejr.value.desrep
    }).subscribe({
      next: (actualizado: Reportesjr) => {
        this.authService.swal('success', `Datos del Reporte ${actualizado.nomrep} modificados con éxito`);
        this.regresar();
      },
      error: (err) => {
        console.error('Error al actualizar metadatos', err);
        this.authService.mostrarError('Error al actualizar metadatos', err.error);
      }
    });
  }

  // Actualiza todo, incluidos los archivos
  axtualizarCompleto(): void {
    this.swactualizando = true;
    this.repojrService.actualizarCompleto(this.idreporte, {
      idrepoxopcion: this.idrepoxopcion!,
      nomrep: this.formReportejr.value.nomrep,
      metodo: this.formReportejr.value.metodo,
      desrep: this.formReportejr.value.desrep,
      jrxml: this.jrxmlFile!,
      jasper: this.jasperFile!,
    }).subscribe({
      next: (actualizado: Reportesjr) => {
        this.authService.swal('success', `Archivos del reporte ${actualizado.nomrep} modificados con éxito`);
        this.swactualizando = false;
        this.regresar();
      },
      error: (err) => {
        console.error('Error al actualizar metadatos', err);
        this.authService.mostrarError('Error al actualizar metadatos', err.error);
      }
    });
  }

  //Valida que se haya seleccionado una Opción
  valRepoxopcion(control: AbstractControl) {
    if (this.idrepoxopcion == null) return of({ 'invalido': true });
    else return of(null);
  }

  //Valida la selección de archivos
  validaArchivos(control: AbstractControl): ValidationErrors | null {
    const files = control.value;
    // Validación 1: existencia del objeto
    if (!files || typeof files !== 'object') { return { archivosIncompletos: true }; }
    const { jrxml, jasper } = files;
    // Validación 2: presencia de ambos archivos
    if (!jrxml || !jasper) { return { archivosIncompletos: true }; }
    // Validación 3: exceso de archivos (si se pasó un array por error)
    if (Array.isArray(files) && files.length > 2) { return { excesoArchivos: true }; }
    // Validación 4: coincidencia de nombre base
    const baseJrxml = jrxml.name.replace(/\.jrxml$/i, '');
    const baseJasper = jasper.name.replace(/\.jasper$/i, '');
    if (baseJrxml !== baseJasper) { return { nombresNoCoinciden: true }; }
    return null;
  }

  //Valida nomrep
  valNomrep(control: AbstractControl) {
    return this.repojrService.valNomrep(control.value).pipe(
      map(result => this.antnomrep != control.value && result ? { existe: true } : null)
    );
  }

}

function decodeBase64ToXml(base64: string): string {
  const binary = atob(base64); // decodifica Base64 a string binario
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

function extractReportNameFromJrxml(xmlString: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const jasperReport = doc.getElementsByTagName('jasperReport')[0];
  return jasperReport?.getAttribute('name') ?? null;
}