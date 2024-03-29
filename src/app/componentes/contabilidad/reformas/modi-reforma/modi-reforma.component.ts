import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { ReformasService } from 'src/app/servicios/contabilidad/reformas.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';

@Component({
  selector: 'app-modi-reforma',
  templateUrl: './modi-reforma.component.html',
  styleUrls: ['./modi-reforma.component.css'],
})
export class ModiReformaComponent implements OnInit {
  formReforma: any;
  disabled = false;
  antnumdoc: String;
  idrefo: number; //Id del reforma que se modifica
  _documentos: any;

  constructor(
    public fb: FormBuilder,
    public reformaService: ReformasService,
    private documentosService: DocumentosService,
    private router: Router,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    this.idrefo = +sessionStorage.getItem('idrefoToModi')!;
    let fechad: Date = new Date();
    let documentos: Documentos = new Documentos();
    this.listarDocumentos();

    this.formReforma = this.fb.group(
      {
        numero: [null, [Validators.required, Validators.min(1)]],
        fecha: fechad,
        tipo: 'G',
        valor: 0,
        concepto: [null, [Validators.required]],
        numdoc: [
          '',
          [
            Validators.required,
            Validators.minLength(1),
            Validators.maxLength(12),
          ],
        ],
        iddocumento: documentos,
        usucrea: this.authService.idusuario,
        feccrea: fechad,
        usumodi: this.authService.idusuario,
        fecmodi: fechad,
      },
      { updateOn: 'blur' }
    );

    this.datosReforma();
  }

  listarDocumentos() {
    this.documentosService.getListaDocumentos().subscribe({
      next: (resp) => (this._documentos = resp),
      error: (err) => console.log(err.error),
    });
  }

  datosReforma() {
    this.reformaService.getById(this.idrefo).subscribe({
      next: (datos) => {
        this.antnumdoc = datos.numdoc;
        this.formReforma.setValue({
          numero: datos.numero,
          fecha: datos.fecha,
          tipo: datos.tipo,
          valor: datos.valor,
          concepto: datos.concepto,
          numdoc: datos.numdoc,
          iddocumento: datos.iddocumento,
          usucrea: datos.usucrea,
          feccrea: datos.feccrea,
          usumodi: datos.usumodi,
          fecmodi: datos.fecmodi,
        });
      },
      error: (err) => console.log(err.msg.error),
    });
  }

  get f() {
    return this.formReforma.controls;
  }

  onSubmit() {
    this.reformaService
      .updateReforma(this.idrefo, this.formReforma.value)
      .subscribe({
        next: (resp) => this.regresar(),
        error: (err) => console.log(err.error.msg),
      });
  }

  regresar() {
    this.router.navigate(['/reformas']);
  }

  compararDocumentos(o1: Documentos, o2: Documentos): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.iddocumento == o2.iddocumento;
    }
  }
}
