import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Cajas } from 'src/app/modelos/cajas.model';
import { Ptoemision } from 'src/app/modelos/ptoemision';
import { CajaService } from 'src/app/servicios/caja.service';
import { PtoemisionService } from 'src/app/servicios/ptoemision.service';

@Component({
  selector: 'app-modificar-caja',
  templateUrl: './modificar-caja.component.html',
})
export class ModificarCajaComponent implements OnInit {
  caja: Cajas = new Cajas();
  cajaForm: FormGroup;
  codigo: String;
  disabled: boolean = true;
  ptoemision: any;
  rtn: number; //0=Ok, 1=Vacio, 2=Ya existe
  vecvalido: Boolean[] = [true, true];

  constructor(
    public fb: FormBuilder,
    private cajaService: CajaService,
    private router: Router,
    private ptoemiService: PtoemisionService,
    private authService: AutorizaService
  ) {}

  ngOnInit() {
    let fecha: Date = new Date();
    this.cajaForm = this.fb.group({
      idcaja: [''],
      codigo: ['', Validators.required],
      descripcion: ['', Validators.required],
      idptoemision_ptoemision: ['', Validators.required],
      estado: ['', Validators.required],
      usucrea: this.authService.idusuario,
      feccrea: fecha,
      usumodi: this.authService.idusuario,
      fecmodi: fecha,
    });
    this.listarPtoEmision();
    this.iniciar();
    this.valCodigoCaja();
    this.valDescriCaja();
  }

  iniciar() {
    let fecha: Date = new Date();
    let idcaja = localStorage.getItem('idcajaToModi');
    this.cajaService.getById(+idcaja!).subscribe((datos) => {
      this.cajaForm.setValue({
        idcaja: datos.idcaja,
        codigo: datos.codigo,
        descripcion: datos.descripcion,
        idptoemision_ptoemision: datos.idptoemision_ptoemision,
        estado: datos.estado,
        usucrea: this.authService.idusuario,
        feccrea: datos.feccrea,
        usumodi: this.authService.idusuario,
        fecmodi: fecha,
      });
    });
  }

  onSubmit() {
    this.cajaService.updateCaja(this.cajaForm.value).subscribe(
      (datos) => {},
      (error) => console.log(error)
    );
    this.retornar();
  }

  listarPtoEmision() {
    this.ptoemiService.getListaPtoEmision().subscribe(
      (datos) => {
        this.ptoemision = datos;
      },
      (error) => console.log(error)
    );
  }

  retornar() {
    this.router.navigate(['info-caja']);
  }

  valCodigoCaja() {
    let h_codigo = document.getElementById('codigo') as HTMLInputElement;
    h_codigo.addEventListener('keyup', () => {
      let l_value = h_codigo.value;
      if (l_value.length === 3 && +l_value > 0) {
        h_codigo.style.border = '';
        this.rtn = 0;
        this.vecvalido[0] = true;
        this.disabled = funvalidar(...this.vecvalido);
      } else {
        h_codigo.style.border = '#F54500 1px solid';
        this.vecvalido[0] = false;
        this.disabled = funvalidar(...this.vecvalido);
      }
    });
  }

  valDescriCaja() {
    let h_descripcion = document.getElementById(
      'descripcion'
    ) as HTMLInputElement;
    h_descripcion.addEventListener('keyup', () => {
      let l_value = h_descripcion.value;
      if (l_value.length >= 3) {
        h_descripcion.style.border = '';
        this.rtn = 0;
        this.vecvalido[1] = true;
        this.disabled = funvalidar(...this.vecvalido);
      } else {
        h_descripcion.style.border = '#F54500 1px solid';
        this.vecvalido[1] = false;
        this.disabled = funvalidar(...this.vecvalido);
      }
    });
  }

  compararPtoEmision(o1: Ptoemision, o2: Ptoemision): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idptoemision == o2.idptoemision;
    }
  }
}

//Recorre el vector para verificar si todos los campos son válidos
function funvalidar(...vector: Boolean[]) {
  for (let i = 0; i < vector.length; i++) {
    if (vector[i] == false) {
      return true;
    }
  }
  return false;
}
