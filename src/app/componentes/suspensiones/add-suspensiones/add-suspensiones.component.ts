import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, RequiredValidator } from '@angular/forms';
import { Router } from '@angular/router';
import { Abonados } from 'src/app/modelos/abonados';
import { Aboxsuspension } from 'src/app/modelos/aboxsuspension';
import { BuscarabonadoComponent } from '../../abonados/buscarabonado/buscarabonado.component';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { SuspensionesService } from 'src/app/servicios/suspensiones.service';
import { AboxsuspensionService } from 'src/app/servicios/aboxsuspension.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { RutasService } from 'src/app/servicios/rutas.service';
import { Rutas } from 'src/app/modelos/rutas.model';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { FacturaService } from 'src/app/servicios/factura.service';

@Component({
  selector: 'app-add-suspensiones',
  templateUrl: './add-suspensiones.component.html',
  styleUrls: ['./add-suspensiones.component.css'],
})
export class AddSuspensionesComponent implements OnInit {
  titulo: string = 'Nueva Suspensión';
  f_dsuspension: FormGroup;
  f_rutas: FormGroup;
  filterTerm: string;
  v_documentos: any;
  l_abonados: any = [];
  l_lecturas: any;
  aboxsuspension: Aboxsuspension = new Aboxsuspension();
  documentos: Documentos = new Documentos();
  total = 0;
  date: Date = new Date();
  today: number = Date.now();
  ruta: any;

  constructor(
    private router: Router,
    private s_documentos: DocumentosService,
    private s_suspensiones: SuspensionesService,
    private s_aboxsuspension: AboxsuspensionService,
    private s_lecturas: LecturasService,
    private fb: FormBuilder,
    private s_abonado: AbonadosService,
    private s_rutas: RutasService,
    private authService: AutorizaService,
    private s_facturas: FacturaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/suspensiones');
    let coloresJSON = sessionStorage.getItem('/suspensiones');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    this.f_dsuspension = this.fb.group({
      tipo: 1,
      fecha: this.today,
      numero: '',
      iddocumento_documentos: [1],
      observa: [''],
      numdoc: [''],
      total: [''],
      usucrea: this.authService.idusuario,
      feccrea: this.date,
    });

    this.f_rutas = this.fb.group({
      codnomb: '',
    });
    this.listarDocumentos();
    this.getUltimo();
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  onSubmit() {
    console.log(this.f_dsuspension.value);
    this.guardarSuspension();
  }

  listarDocumentos() {
    this.s_documentos.getListaDocumentos().subscribe((datos) => {
      this.v_documentos = datos;
      error: console.error;
    });
  }

  guardarSuspension() {
    this.f_dsuspension.value.iddocumento_documentos = {
      iddocumento: +this.f_dsuspension.value.iddocumento_documentos!,
    };
    if (
      this.f_dsuspension.value.tipo !== '' &&
      this.f_dsuspension.value.fecha !== ''
    ) {
      let suspensionSaved: any;
      this.s_suspensiones.saveSuspension(this.f_dsuspension.value).subscribe({
        next: (datos) => {
          suspensionSaved = datos;
          this.guardarAboxSuspension(suspensionSaved);
        },
        error: (e) => console.error(e),
      });
    }
  }

  guardarAboxSuspension(suspensionS: any) {
    let abonado: Abonados = new Abonados();
    this.l_lecturas.forEach((lectura: any) => {
      abonado = lectura.idabonado_abonados;
      this.aboxsuspension.idsuspension_suspensiones = suspensionS;
      this.aboxsuspension.idabonado_abonados = abonado;
      this.s_aboxsuspension.saveAboxSuspension(this.aboxsuspension).subscribe({
        next: (datos) => {
          console.log(datos);
        },
        error: (e) => {
          console.error(e);
        },
      });
      abonado.estado = 2;
      this.actualizarAbonado(abonado);
    });
    this.listarSuspensiones();
  }

  listarSuspensiones() {
    this.router.navigate(['suspensiones']);
  }

  selecRuta(ruta: Rutas) {
    let aboxdeuda: any = { abonado: {}, facturas: [] };
    let date: Date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth();
    let current_s: any = `${year}-${month}-01`;
    let current_f: any = `${year}-${month + 1}-01`;

    this.s_abonado.getByIdrutaAsync(ruta.idruta).then((_abonados: any) => {
      let dato_abonado : any;
      _abonados.forEach((abonado: any) => {
        this.s_facturas.getSinCobrarAboMod(abonado.idabonado).subscribe({
          next: (deuda: any) => {
            aboxdeuda.abonado = abonado;
            aboxdeuda.facturas.deudas;
            return aboxdeuda;
          },
          error: (e) => console.error(e),
          complete: () => {
          },
        });
      });
    });
    // this.s_lecturas.getDeudores(current_s, current_f, ruta.idruta).subscribe({
    //    next: (datos: any) => {
    //       this.f_dsuspension.patchValue({
    //          total: datos.length,
    //       });
    //       this.total = datos.length;
    //       this.l_lecturas = datos;
    //    },
    //    error: (e) => console.error(e),
    // });
  }

  setRuta(e: any) {
    this.ruta = e;
    this.selecRuta(e);
  }

  getUltimo() {
    // this.s_suspensiones.getUltimo().subscribe({
    //    next: (datos: any) => {
    //       if (datos != null) {
    //          this.f_dsuspension.patchValue({
    //             numero: +datos.numero! + 1,
    //          });
    //       } else {
    //          this.f_dsuspension.patchValue({
    //             numero: 1,
    //          });
    //       }
    //    },
    //    error: (e) => console.error(e),
    // });
  }

  actualizarAbonado(abonado: Abonados) {
    this.s_abonado.updateAbonado(abonado).subscribe({
      next: (datos) => {
        console.log('Abonado Acutalizado', datos);
      },
      error: (e) => {
        console.error(e);
      },
    });
  }
}
