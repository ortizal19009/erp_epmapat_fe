import { Component, HostListener, OnInit } from '@angular/core';
import { MainFooterComponent } from '../main-footer/main-footer.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AutorizaService } from '../compartida/autoriza.service';
import { UsuarioService } from '../servicios/administracion/usuario.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-header',
  templateUrl: './main-header.component.html',
  styleUrls: ['./main-header.component.css'],
})
export class MainHeaderComponent implements OnInit {
  fondo1: number;
  modulos: String[];
  enabled: boolean[];
  formDefinir: FormGroup;
  tmpmodu: number;
  modules: any;

  constructor(
    private footer: MainFooterComponent,
    public fb: FormBuilder,
    public authService: AutorizaService,
    private usuService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const modulos: any = sessionStorage.getItem('modulos');
    this.modules = JSON.parse(modulos);
    //Fondo
    let fondoActual = sessionStorage.getItem('fondoActual')?.toString();
    this.fondo1 = +fondoActual!;
    //Módulos
    this.modulos = [
      'Comercialización',
      'Contabilidad gubernamental',
      'Inventario',
      'Propiedad, planta y equipo',
      'Recursos humanos',
      'Coactivas',
      'Administración central',
    ];

    setInterval(() => {
      this.checkModulos();
    }, 2000); // 2000 ms = 2 segundos

    // console.log('Esta en ngOnInit() de header')
    this.authService.valsession();

    this.authService.nomodulo = this.modulos[this.authService.moduActual - 1]; //No hay modulos
    if (this.authService.sessionlog) this.authService.enabModulos();
    else this.enabled = [false, false, false, false, false, false, false];

    this.formDefinir = this.fb.group({
      fdesde: '',
      fhasta: '',
      otrapestania: '',
    });
  }

  checkModulos() {
    if (this.modules === null) {
      const modulos: any = sessionStorage.getItem('modulos');
      this.modules = JSON.parse(modulos);
    }
  }
  fondo() {
    if (!this.fondo1) {
      this.fondo1 = 1;
    } else {
      this.fondo1 = this.fondo1 * -1;
    }
    sessionStorage.setItem('fondoActual', this.fondo1.toString());
    this.footer.fondo(this.fondo1);
  }

  definir() {
    this.formDefinir.controls['fdesde'].setValue(
      sessionStorage.getItem('fdesde')
    );
    this.formDefinir.controls['fhasta'].setValue(
      sessionStorage.getItem('fhasta')
    );
    if (sessionStorage.getItem('otrapestania') == 'true')
      this.formDefinir.controls['otrapestania'].setValue(true);
    else this.formDefinir.controls['otrapestania'].setValue(false);
    const modulos: any = sessionStorage.getItem('modulos');
    console.log(JSON.parse(modulos));
    this.modules = JSON.parse(modulos);
  }

  guardarDefinir() {
    this.usuService.getByIdusuario(1).subscribe({
      next: (resp) => {
        resp.fdesde = this.formDefinir.value.fdesde;
        resp.fhasta = this.formDefinir.value.fhasta;
        resp.otrapestania = this.formDefinir.value.otrapestania;
        this.usuService.updateUsuario(1, resp).subscribe({
          next: (resp) => {
            sessionStorage.setItem(
              'fdesde',
              this.formDefinir.value.fdesde.toString()
            );
            sessionStorage.setItem(
              'fhasta',
              this.formDefinir.value.fhasta.toString()
            );
            sessionStorage.setItem(
              'otrapestania',
              this.formDefinir.value.otrapestania.toString()
            );
          },
          error: (err) => console.error(err.error),
        });
      },
      error: (err) => console.error(err.error),
    });
  }
}
