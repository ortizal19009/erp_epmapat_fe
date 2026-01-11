import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';

@Component({
  selector: 'app-modi-usuario',
  templateUrl: './modi-usuario.component.html',
  styleUrls: ['./modi-usuario.component.css']
})

export class ModiUsuarioComponent implements OnInit {

  formUsuario: FormGroup;
  idusuarioModi: number;
  date: Date = new Date();
  usu = {} as Usu; //Interface para los datos del Usuario
  _personal: any[] = [];
  filtrarPersonal: string;

  constructor(public fb: FormBuilder, private router: Router, public authService: AutorizaService,
    private usuService: UsuarioService, private coloresService: ColoresService, private personalService: PersonalService) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/usuarios');
    let coloresJSON = sessionStorage.getItem('/usuarios');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.idusuarioModi = +sessionStorage.getItem('idusuarioToModi')!;
    sessionStorage.removeItem('idusuarioToModi')

    this.formUsuario = this.fb.group({
      identificausu: [{ value: '', disabled: this.authService.idusuario > 1 || this.idusuarioModi == 1 }, [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      alias: [{ value: '', disabled: this.idusuarioModi == 1 }, [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
      nomusu: [{ value: '', disabled: this.authService.idusuario > 1 || this.idusuarioModi == 1 }, [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      codusu: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]],
      reingreso: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)], this.valReingreso.bind(this)],
      estado: { value: '', disabled: this.authService.idusuario > 1 },
      otrapestania: '',
      email: '',
      fdesde: '',
      fhasta: '',
      feccrea: '',
      usumodi: '',
      fecmodi: ''
    },
      { updateOn: "blur" }
    );
    this.getListarPersonal();

    //Al digitar psw resetea reingreso
    this.formUsuario.get('codusu')!.valueChanges.subscribe(valor => {
      if (valor !== '') this.formUsuario.get('reingreso')!.reset();
    });

    this.buscaUsuario();
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(this.authService.idusuario, 'usuarios');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/usuarios', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1')
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  get f() { return this.formUsuario.controls; }

  buscaUsuario() {
    this.usuService.getByIdusuario(this.idusuarioModi).subscribe({
      next: datos => {
        this.formUsuario.setValue({
          identificausu: datos.identificausu,
          alias: datos.alias,
          nomusu: datos.nomusu,
          codusu: datos.codusu,
          reingreso: datos.codusu,
          estado: datos.estado,
          otrapestania: datos.otrapestania,
          email: datos.email,
          fdesde: datos.fdesde,
          fhasta: datos.fhasta,
          feccrea: datos.feccrea,
          usumodi: this.authService.idusuario,
          fecmodi: this.date,
        });
        this.filtrarPersonal = datos.identificausu;
      },
      error: err => console.error(err.error)
    });
  }

  guardar() {

    if (this.formUsuario.get('codusu')!.dirty) {
      const b = myFun(this.formUsuario.get('codusu')!.value);
      this.formUsuario.get('codusu')!.setValue(b);
    }

    const valoresFormulario = this.formUsuario.getRawValue();
    valoresFormulario.usumodi = this.authService.idusuario;
    valoresFormulario.fecmodi = this.date;

    this.usuService.updateUsuario(this.idusuarioModi, valoresFormulario).subscribe({
      next: () => this.regresar(),
      error: err => console.error(err.error)
    });
  }

  getListarPersonal() {
    this.personalService.getAllPersonal().subscribe({
      next: (datos: any) => {
        console.log(datos);
        this._personal = datos;
      },
      error: (err: any) => console.error(err.error)
    });
  }

  regresar() {
    if (this.authService.idusuario == 1) this.router.navigate(['/usuarios']);
    else this.router.navigateByUrl('/inicio')
  }

  //Valida que Reingreso sea igual
  valReingreso(control: AbstractControl) {
    if (this.formUsuario.value.codusu != control.value) return of({ 'invalido': true });
    else return of(null);
  }
  unirPersonal(per: any) {

    // Si el control no existe, lo agregamos
    if (!this.formUsuario.get('personal')) {
      this.formUsuario.addControl('personal', new FormControl(null));
    }

    // Asignar SOLO el ID (como espera Spring Boot)
    this.formUsuario.get('personal')?.setValue({
      idpersonal: per.idpersonal
    });

    // Mostrar a quién se unió (solo visual)
    this.filtrarPersonal = `${per.apellidos} ${per.nombres}`;

    // Marcar cambios para habilitar Guardar
    this.formUsuario.markAsDirty();
  }

}

function myFun(x: string): string {
  let y = "";
  for (let i = 0; i < x.length; i++) {
    y += String(x.charCodeAt(i));
  }
  let rtn = "";
  for (let i = 0; i < y.length; i += 2) {
    rtn += y[i];
  }
  rtn += String(x.trim().length);
  for (let i = y.length - 1; i >= 0; i -= 2) {
    rtn += y[i];
  }
  return rtn;
}

interface Usu {
  identificausu: string;
}
