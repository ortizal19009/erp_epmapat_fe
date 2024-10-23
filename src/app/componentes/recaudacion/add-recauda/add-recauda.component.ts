import { FormStyle } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RecaudacionService } from 'src/app/servicios/microservicios/recaudacion.service';

@Component({
  selector: 'app-add-recauda',
  templateUrl: './add-recauda.component.html',
  styleUrls: ['./add-recauda.component.css'],
})
export class AddRecaudaComponent implements OnInit {
  filtrar: string;
  _sincobro: any;
  f_buscar: FormGroup;
  nombre: string;
  constructor(
    private fb: FormBuilder,
    private ms_recaudacion: RecaudacionService
  ) {}

  ngOnInit(): void {
    this.f_buscar = this.fb.group({
      cuenta: '',
      identificacion: '',
    });
  }

  btn_buscar() {
    this.getSinCobro(this.f_buscar.value.cuenta);
  }

  async getSinCobro(cuenta: number) {
    let sincobro = await this.ms_recaudacion.getSincobroByCuenta(cuenta);
    console.log(sincobro);
    this.nombre = sincobro[0].nombre;
    this._sincobro = sincobro;
  }
  swSincobro(){
    if(this._sincobro != null){
      return true; 
    }
    return false;
  }
}
