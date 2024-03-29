import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Clasificador } from 'src/app/modelos/clasificador.model';
import { ClasificadorService } from 'src/app/servicios/clasificador.service';

@Component({
  selector: 'app-modi-clasificador',
  templateUrl: './modi-clasificador.component.html',
  styleUrls: ['./modi-clasificador.component.css'],
})
export class ModiClasificadorComponent implements OnInit {
  clasificador: Clasificador = new Clasificador();
  clasificadorForm: FormGroup;
  nompar: String;
  disabled: boolean = true;
  rtn: number; //0=Ok, 1=Vacio, 2=Ya existe
  vecvalido: Boolean[] = [true, true];

  constructor(
    public fb: FormBuilder,
    private clasificadorService: ClasificadorService,
    private router: Router,
    private authService: AutorizaService
  ) {}

  ngOnInit() {
    this.clasificadorForm = this.fb.group({
      intcla: [''],
      codpar: ['', Validators.required],
      nivpar: [''],
      grupar: [''],
      nompar: ['', Validators.required],
      despar: ['', Validators.required],
      cueejepresu: '',
      presupuesto: 0,
      ejecucion: 0,
      devengado: 0,
      reforma: 0,
      asigna_ini: 0,
      usucrea: this.authService.idusuario,
      feccrea: [],
      usumodi: this.authService.idusuario,
      fecmodi: null,
      grupo: null,
      balancostos: 0,
    });
    this.iniciar();
    this.valNombreCta();
  }

  iniciar() {
    let fecha: Date = new Date();
    let intcla = localStorage.getItem('intclaToModi');
    this.clasificadorService.getById(+intcla!).subscribe((datos) => {
      this.clasificadorForm.setValue({
        intcla: datos.intcla,
        codpar: datos.codpar,
        nivpar: datos.nivpar,
        grupar: datos.grupar,
        nompar: datos.nompar,
        despar: datos.despar,
        cueejepresu: '',
        presupuesto: 0,
        ejecucion: 0,
        devengado: 0,
        reforma: 0,
        asigna_ini: 0,
        usucrea: this.authService.idusuario,
        feccrea: fecha,
        usumodi: null,
        fecmodi: null,
        grupo: null,
        balancostos: 0,
      });
    });
  }

  onSubmit() {
    this.clasificadorService
      .updateClasificador(this.clasificadorForm.value)
      .subscribe(
        (datos) => {},
        (error) => console.log(error)
      );
    this.retornar();
  }

  retornar() {
    this.router.navigate(['info-clasificador']);
  }

  valNombreCta() {
    let h_codigo = document.getElementById('nompar') as HTMLInputElement;
    h_codigo.addEventListener('keyup', () => {
      let l_value = h_codigo.value;
      if (l_value.length >= 3) {
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
