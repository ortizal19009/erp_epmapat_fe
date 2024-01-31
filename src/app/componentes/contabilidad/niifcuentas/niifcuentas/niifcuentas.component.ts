import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NiifcuentasService } from 'src/app/servicios/contabilidad/niifcuentas.service';
import { NiifhomologaService } from 'src/app/servicios/contabilidad/niifhomologa.service';

@Component({
  selector: 'app-niifcuentas',
  templateUrl: './niifcuentas.component.html',
  styleUrls: ['./niifcuentas.component.css']
})
export class NiifcuentasComponent implements OnInit {

  f_cuentasniif: FormGroup;
  filterTerm: string;
  cuentasNiif: any;
  homologacionesNiif: any;
  listaNef: boolean = false;
  hab_homologa: boolean = false;
  hab_addPlanCuentas: boolean = false;
  hab_modPlanCuentas: boolean = false;
  deleteBox: boolean = false;
  niifcuenta: any;
  homologa: any;

  constructor(private s_niifcuentas: NiifcuentasService, private fb: FormBuilder,
    private router: Router, private s_niifhomologa: NiifhomologaService) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/niifcuentas');
    this.setcolor();

    this.f_cuentasniif = this.fb.group({
      selecTipoBusqueda: 1,
      codNomCue: '',
    });
    this.getPlanCuentasNiif();
  }

  setcolor() {
    let colores: string[];
    let coloresJSON = sessionStorage.getItem('/niifcuentas');
    if (!coloresJSON) {
      colores = ['rgb(144, 123, 5)', 'rgb(249, 249, 175)'];
      const coloresJSON = JSON.stringify(colores);
      sessionStorage.setItem('/niifcuentas', coloresJSON);
    } else colores = JSON.parse(coloresJSON);

    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1')
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  onSubmit() {
    this.getByCodNomCue();
  }

  addhomologa(){
    this.router.navigate(['/add-homologa']);
  }

  getPlanCuentasNiif() {
    this.s_niifcuentas.getAllCuentasNiif().subscribe({
      next: (datos) => {
        this.cuentasNiif = datos;
      },
      error: (e) => console.error(e),
    });
  }

  getByCodNomCue() {
    let tpBusqueda = +this.f_cuentasniif.value.selecTipoBusqueda!;
    let valBusqueda = this.f_cuentasniif.value.codNomCue;
    if (valBusqueda === '') {
      this.getPlanCuentasNiif();
    }
    if (tpBusqueda === 1) {
      this.s_niifcuentas.getByCodCue(valBusqueda).subscribe({
        next: (datos) => {
          this.cuentasNiif = datos;
        },
      });
    } else if (tpBusqueda === 2) {
      this.s_niifcuentas.getByNomCue(valBusqueda).subscribe({
        next: (datos) => {
          this.cuentasNiif = datos;
        },
      });
    } else {
      this.getPlanCuentasNiif();
    }
  }
  
  getByIdNiifCue(cuentaniif: any) {
    console.log(cuentaniif);
    this.listaNef = cuentaniif.movcue;
    this.niifcuenta = cuentaniif;
    this.s_niifhomologa.getByIdNiifCue(cuentaniif.idniifcue).subscribe({
      next: (datos: any) => {
        console.log(datos);
        if (datos.length != 0 || cuentaniif.movcue === true) {
          this.homologacionesNiif = datos;
          this.listaNef = true;
        } else {
          this.listaNef = false;
        }
      },
      error: (e) => {
        console.error(e);
      },
    });
  }

  act_addPlanCuentas() {
    this.niifcuenta = [];
    this.hab_addPlanCuentas = false;
    setTimeout(() => {
      this.hab_addPlanCuentas = true;
      this.hab_homologa = false;
      this.hab_modPlanCuentas = false;
    }, 300);
  }

  act_modPlanCuentas() {
    this.hab_modPlanCuentas = false;
    setTimeout(() => {
      this.hab_modPlanCuentas = true;
      this.hab_homologa = false;
      this.hab_addPlanCuentas = false;
    }, 300);
  }

  act_homologa() {
    this.hab_addPlanCuentas = false;
    this.hab_homologa = true;
  }

  des_homologa(e: any) {
    setTimeout(() => {
      this.hab_homologa = e;
    }, 300);
  }

  des_addPlanCuentas(e: any) {
    setTimeout(() => {
      this.hab_addPlanCuentas = e;
    }, 300);
  }

  optHomolofaciones(homologa: any) {
    this.homologa = homologa;
    this.deleteBox = true;
  }

  deleteHomologa() {
    this.s_niifhomologa.deleteById(this.homologa.idhomologa).subscribe({
      next: (datos) => {
        this.getByIdNiifCue(this.niifcuenta);
      },
      error: (e) => console.error(e),
    });
  }

  cancelar() {
    setTimeout(() => {
      this.deleteBox = false;
    }, 300);
  }

  modificar(niifCuenta: any) {
    this.act_modPlanCuentas();
    this.niifcuenta = niifCuenta;
  }

}
