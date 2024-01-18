import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { PartixcertiService } from 'src/app/servicios/contabilidad/partixcerti.service';
// import { PresupueService } from 'src/app/servicios/contabilidad/presupue.service';

@Component({
  selector: 'app-partixcerti',
  templateUrl: './partixcerti.component.html',
  styleUrls: ['./partixcerti.component.css']
})

export class PartixcertiComponent implements OnInit {

  f_presupue: FormGroup;
  date: Date = new Date();
  titulo: string = 'Info presupuestos';
  presuDatos: any;
  v_presupue: any;
  t_presupue: boolean = true;
  d_presupue: boolean = false;
  x: boolean = false;
  modificar: boolean = false;
  certixpresu: any;
  dpartidas: any;
  presupue: any;
  modpresupue: boolean = false;
  
  constructor(private s_beneficiarios: BeneficiariosService,
    private router: Router,
    private fb: FormBuilder,
    private s_documentos: DocumentosService,
    private s_certipresu: CertipresuService,
    private s_partixcerti: PartixcertiService,
    ) { }

  ngOnInit(): void {
    this.f_presupue = this.fb.group({
      cod_nom: '',
    });

    this.obtenerCertipresu();
  }

  obtenerCertipresu() {
    let idcerti = sessionStorage.getItem('certipresuStorage')?.toString();
    this.s_certipresu.getByIdCerti(+idcerti!).subscribe({
      next: (datos) => {
        this.presuDatos = datos;
        this.obtenerPartiCerti();
      },
      error: (e) => console.error(e),
    });
  }
  retroceder() {
    this.router.navigate(['certipresu']);
  }
  obtenerPartiCerti() {
    this.s_partixcerti.getByIdCerti(this.presuDatos.idcerti).subscribe({
      next: (datos) => {
        this.v_presupue = datos;
      },
      error: (e) => console.error(e),
    });
  }
  obtenerPresupe() {
    if (this.f_presupue.value.cod_nom !== '') {
      // this.s_presupue.getCodNom(this.f_presupue.value.cod_nom).subscribe({
      //   next: (datos) => {
      //     this.dpartidas = datos;
      //     if (datos[0] !== undefined) {
      //       this.d_presupue = true;
      //     } else {
      //       this.d_presupue = false;
      //     }
      //   },
      //   error: (e) => console.error(e),
      // });
    }
  }
  setPresupue(presupue: any) {
    this.presupue = presupue;
    this.t_presupue = false;
    this.d_presupue = false;
  }
  changeTipo(e: boolean) {
    this.d_presupue = e;
    this.t_presupue = e;
  }
  reload(e: boolean) {
    this.x = e;
    if (e === true) {
      this.obtenerCertipresu();
    }
  }
  modcertixpresu(presupue: any) {
    this.modificar = false;
    this.certixpresu = presupue;
    setTimeout(() => {
      this.modificar = true;
    }, 300);
  }
  modPresupue() {
    this.modpresupue = false;
    setTimeout(() => {
      this.modpresupue = true;
    }, 300);
  }
}
