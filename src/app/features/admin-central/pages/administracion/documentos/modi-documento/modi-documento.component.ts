import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Tabla4 } from 'src/app/modelos/administracion/tabla4.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { Tabla4Service } from 'src/app/servicios/administracion/tabla4.service';

@Component({
  selector: 'app-modi-documento',
  templateUrl: './modi-documento.component.html',
  styleUrls: ['./modi-documento.component.css'],
})
export class ModiDocumentoComponent implements OnInit {
  formDocumento: FormGroup;
  disabled = true;
  _tabla4: any;
  antnomdoc: String;
  iddocumento: number; //Id del documento que se modifica
  date: Date = new Date();

  constructor(
    public fb: FormBuilder,
    public docuService: DocumentosService,
    private tab4Service: Tabla4Service,
    private router: Router,
    private authService:AutorizaService
  ) {}

  ngOnInit(): void {
    this.iddocumento = +sessionStorage.getItem('iddocumentoToModi')!;
    let tabla4: Tabla4 = new Tabla4();
    this.listarTabla4();

    this.formDocumento = this.fb.group(
      {
        nomdoc: [
          null,
          [Validators.required, Validators.minLength(3)],
          this.valNomdoc.bind(this),
        ],
        tipdoc: ['', [Validators.required]],
        idtabla4: tabla4,
        usucrea: this.authService.idusuario,
        feccrea: this.date,
        usumodi: this.authService.idusuario,
        fecmodi: this.date,
      },
      { updateOn: 'blur' }
    );
    this.datosDocumento();
  }

  listarTabla4() {
    this.tab4Service.getListaTabla4().subscribe({
      next: (resp) => (this._tabla4 = resp),
      error: (err) => console.error(err.error),
    });
  }

  datosDocumento() {
    const fechaHora = new Date();
    const data = { fechaHora: fechaHora.toISOString() };
    this.docuService.getById(this.iddocumento).subscribe({
      next: (datos) => {
        this.antnomdoc = datos.nomdoc;
        this.formDocumento.setValue({
          nomdoc: datos.nomdoc,
          tipdoc: datos.tipdoc,
          idtabla4: datos.idtabla4,
          usucrea: datos.usucrea,
          feccrea: datos.feccrea,
          usumodi: 2,
          fecmodi: fechaHora,
        });
      },
      error: (err) => console.error(err.error),
    });
  }

  get f() {
    return this.formDocumento.controls;
  }

  onSubmit() {
    this.docuService
      .updateDocumento(this.iddocumento, this.formDocumento.value)
      .subscribe({
        next: (resp) => this.retornar(),
        error: (err) => console.error(err.error),
      });
  }

  retornar() {
    this.router.navigate(['/info-documento']);
  }

  compararTabla4(o1: Tabla4, o2: Tabla4): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idtabla4 == o2.idtabla4;
    }
  }

  valNomdoc(control: AbstractControl) {
    return this.docuService
      .getByNomdoc(control.value)
      .pipe(
        map((result) =>
          result.length == 1 && control.value != this.antnomdoc
            ? { existe: true }
            : null
        )
      );
  }
}
