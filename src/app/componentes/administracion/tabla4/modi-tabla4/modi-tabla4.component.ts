import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Tabla4Service } from 'src/app/servicios/administracion/tabla4.service';

@Component({
  selector: 'app-modi-tabla4',
  templateUrl: './modi-tabla4.component.html',
  styleUrls: ['./modi-tabla4.component.css'],
})
export class ModiTabla4Component implements OnInit {
  tab4Form: any;
  disabled = true;
  _tabla4: any;
  antTipocomprobante: String;
  antNomcomprobante: String;
  idtabla4: number; //Id del comprobante que se modifica

  constructor(
    public fb: FormBuilder,
    public tab4Service: Tabla4Service,
    private router: Router,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    this.idtabla4 = +sessionStorage.getItem('idtabla4ToModi')!;
    this.tab4Form = this.fb.group(
      {
        tipocomprobante: [
          null,
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(2),
          ],
          this.valTipocomprobante.bind(this),
        ],
        nomcomprobante: [
          null,
          [Validators.required, Validators.minLength(3)],
          this.valNomcomprobante.bind(this),
        ],
        usucrea: this.authService.idusuario,
        feccrea: '',
        usumodi: this.authService.idusuario,
        fecmodi: '',
      },
      { updateOn: 'blur' }
    );
    this.datosTabla4();
  }

  datosTabla4() {
    let date: Date = new Date();
    this.tab4Service.getById(this.idtabla4).subscribe({
      next: (datos) => {
        this.antTipocomprobante = datos.tipocomprobante;
        this.antNomcomprobante = datos.nomcomprobante;
        this.tab4Form.setValue({
          tipocomprobante: datos.tipocomprobante,
          nomcomprobante: datos.nomcomprobante,
          usucrea: datos.usucrea,
          feccrea: datos.feccrea,
          usumodi: 1,
          fecmodi: date,
        });
      },
      error: (err) => console.log(err.msg.error),
    });
  }

  get tipocomprobante() {
    return this.tab4Form.get('tipocomprobante');
  }
  get nomcomprobante() {
    return this.tab4Form.get('nomcomprobante');
  }

  onSubmit() {
    this.tab4Service
      .updateTabla4(this.idtabla4, this.tab4Form.value)
      .subscribe({
        next: (resp) => this.retornar(),
        error: (err) => console.log(err.error),
      });
  }

  retornar() {
    this.router.navigate(['/info-tabla4']);
  }

  valTipocomprobante(control: AbstractControl) {
    return this.tab4Service
      .getByTipocomprobante(control.value)
      .pipe(
        map((result) =>
          result.length == 1 && control.value != this.antTipocomprobante
            ? { existe: true }
            : null
        )
      );
  }

  valNomcomprobante(control: AbstractControl) {
    return this.tab4Service
      .getByNomcomprobante(control.value)
      .pipe(
        map((result) =>
          result.length == 1 && control.value != this.antNomcomprobante
            ? { existe: true }
            : null
        )
      );
  }
}
