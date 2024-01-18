import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Ptoemision } from 'src/app/modelos/ptoemision';
import { PtoemisionService } from 'src/app/servicios/ptoemision.service';

@Component({
  selector: 'app-modificar-ptoemision',
  templateUrl: './modificar-ptoemision.component.html',
  styleUrls: ['./modificar-ptoemision.component.css']
})

export class ModificarPtoemisionComponent implements OnInit {

  ptoemision: Ptoemision = new Ptoemision();
  ptoEmisionForm: FormGroup;
  validar: boolean;

  constructor(private ptoemisionS: PtoemisionService, public fb: FormBuilder,
    private router: Router ) { }

  ngOnInit(): void {
    this.ptoEmisionForm = this.fb.group({
      idptoemision: [''],
      establecimiento: [''],
      direccion: ['', Validators.required],
      estado: ['', Validators.required],
      telefono: ['', Validators.required],
      nroautorizacion: ['', Validators.required],
      usucrea: ['', Validators.required],
      feccrea: ['', Validators.required],
    });
    this.actualizarPtoEmision();
    this.validarEstablecimiento()
  }

  validarEstablecimiento() {
    let i_establecimiento = document.getElementById("establecimiento") as HTMLInputElement;
    let i_nroautorizacion = document.getElementById("nroautorizacion") as HTMLInputElement;
    let v = this.validar;
    i_establecimiento.addEventListener('keyup', () => {
      let ie_value = i_establecimiento.value;
      if (ie_value.length === 3) {
        v = true;
        i_establecimiento.style.border = '';
      } else if (ie_value.length < 3 || ie_value.length > 3) {
        v = false;
        i_establecimiento.style.border = "#F54500 1px solid";
      }
      this.validar = v;
    });
    i_nroautorizacion.addEventListener('keyup', () => {
      let ina_value = i_nroautorizacion.value;
      if (ina_value.length > 10) {
        v = false;
        i_nroautorizacion.style.border = "#F54500 1px solid";
      }else{
        v = true;
        i_nroautorizacion.style.border = "";
      }
      this.validar = v;
    });
  }

  onSubmit() { 
    let i_establecimiento = document.getElementById("establecimiento") as HTMLInputElement;
        if(i_establecimiento.value.length ==3){
      this.validar = true;
    }
    if (this.validar == true) {
      this.ptoemisionS.updatePtoEmision(this.ptoEmisionForm.value).subscribe(datos =>{
      }, error => console.log(error));
    }
  };
  
  actualizarPtoEmision() {
    let idptoemision = sessionStorage.getItem("idptoemisionToInfo");
    this.ptoemisionS.getPtoemisionById(+idptoemision!).subscribe(datos => {
      this.ptoEmisionForm.setValue({
        idptoemision:datos.idptoemision,
        establecimiento: datos.establecimiento,
        direccion: datos.direccion ,
        estado: datos.estado ,
        telefono: datos.telefono ,
        nroautorizacion: datos.nroautorizacion ,
        usucrea: datos.usucrea ,
        feccrea: datos.feccrea 
      })
    })
  }

}
