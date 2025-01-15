import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ColoresService } from 'src/app/compartida/colores.service';
import { CargosService } from 'src/app/servicios/rrhh/cargos.service';
import { ContemergenciaService } from 'src/app/servicios/rrhh/contemergencia.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { TpcontratosService } from 'src/app/servicios/rrhh/tpcontratos.service';

@Component({
  selector: 'app-add-personal',
  templateUrl: './add-personal.component.html',
  styleUrls: ['./add-personal.component.css'],
})
export class AddPersonalComponent implements OnInit {
  f_personal: FormGroup;
  _personal: any;
  _cargos: any;
  _contemergencia: any;
  _tpcontratos: any;
  constructor(
    private coloresService: ColoresService,
    private fb: FormBuilder,
    private s_tpcontratos: TpcontratosService,
    private s_contemergencia: ContemergenciaService,
    private s_cargos: CargosService,
    private s_personal: PersonalService
  ) {}

  ngOnInit(): void {
    this.f_personal = this.fb.group({
      bspersonal: '',
    });
    sessionStorage.setItem('ventana', '/personal');
    let coloresJSON = sessionStorage.getItem('/personal');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    this.getAllCargos();
    this.getAllTpcontratos();
    this.getAllContEmergencia();
  }

  get f() {
    return this.f_personal.controls;
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'abonados');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/abonados', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }
  savePersonal() {}
  regresar() {}
  onBenefiSelected(e: any) {
    console.log(e.targe.value);
  }
  benefixNombre(e: any) {
    console.log(e.targe.value);
  }
  getAllPersonal() {}
  getAllTpcontratos() {
    this.s_tpcontratos.getAllTpcontratos().subscribe({
      next: (datos: any) => {
        console.log(datos);
        this._tpcontratos = datos;
      },
      error: (e: any) => console.error(e),
    });
  }
  getAllContEmergencia() {
    this.s_contemergencia.getAllContEmergencia().subscribe({
      next: (datos: any) => {
        console.log(datos);
        this._contemergencia = datos;
      },
      error: (e: any) => console.error(e),
    });
  }
  getAllCargos() {
    this.s_cargos.getAllCargos().subscribe({
      next: (datos: any) => {
        console.log(datos);
        this._cargos = datos;
      },
      error: (e: any) => console.error(e),
    });
  }
}
