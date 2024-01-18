import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RutasService } from 'src/app/Service/rutas.service';

@Component({
  selector: 'app-modificar-rutas',
  templateUrl: './modificar-rutas.component.html',
  styleUrls: ['./modificar-rutas.component.css']
})
export class ModificarRutasComponent implements OnInit {
  rutasForm: FormGroup;
  rutas: any;
  constructor(private rutasS: RutasService, private router: Router, private fb: FormBuilder) { }


  ngOnInit(): void {
    this.rutasForm = this.fb.group({
      idruta: [''],
      descripcion: ['', Validators.required],
      orden: ['', Validators.required],
      codigo: ['', Validators.required],
      usucrea: ['', Validators.required],
      feccrea: ['', Validators.required],
      usumodi: ['', Validators.required],
      fecmodi: ['', Validators.required],
    });
    this.obtenerRutas();

  }
  obtenerRutas() {
    let idruta = localStorage.getItem("idruta");
    this.rutasS.getListaById(+idruta!).subscribe(datos => {
      this.rutasForm.setValue({
        idruta: datos.idruta,
        descripcion: datos.descripcion,
        orden: datos.orden,
        codigo: datos.codigo,
        usucrea: datos.usucrea,
        feccrea: datos.feccrea,
        usumodi: datos.usumodi,
        fecmodi: datos.fecmodi,
      })
    })
  }
  retornarListaRutas(){
    this.router.navigate(['/rutas']);
  }
  onSubmit() {
    this.rutasS.saveRuta(this.rutasForm.value).subscribe(datos => {
      this.retornarListaRutas();
      this.mensajeSuccess(this.rutasForm.value.descripcion);
    }, error => console.log(error));

  }
  mensajeSuccess(n: String) {
    localStorage.setItem("mensajeSuccess", "Ruta <strong>" + n + "</strong> actualizada");
  }

}
