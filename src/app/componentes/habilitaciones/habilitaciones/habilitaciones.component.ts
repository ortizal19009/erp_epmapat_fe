import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Aboxsuspension } from 'src/app/modelos/aboxsuspension';
import { Clientes } from 'src/app/modelos/clientes';
import { Suspensiones } from 'src/app/modelos/suspensiones';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { AboxsuspensionService } from 'src/app/servicios/aboxsuspension.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { SuspensionesService } from 'src/app/servicios/suspensiones.service';

@Component({
  selector: 'app-habilitaciones',
  templateUrl: './habilitaciones.component.html',
  styleUrls: ['./habilitaciones.component.css'],
})
export class HabilitacionesComponent implements OnInit {
  titulo: string = 'Habilitaciones';
  f_buscarxFechas: FormGroup;
  f_habilitacion: FormGroup;
  today: Date = new Date();
  filterTerm: string;
  suspensiones: any;
  abonado: Abonados = new Abonados();
  cliente: Clientes = new Clientes();
  habilitacion: Suspensiones = new Suspensiones();
  aboxsuspension: Aboxsuspension = new Aboxsuspension();
  l_habilitaciones: boolean = true;
  l_documentos: any;
  btn_habilitacion: boolean = true;
  estado = [
    { valor: 1, estado: 'Activo' },
    { valor: 2, estado: 'Suspendido' },
    { valor: 3, estado: 'Suspendido y retirado' },
  ];
  date: Date = new Date();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private suspeService: SuspensionesService,
    private s_abonado: AbonadosService,
    private s_aboxsuspension: AboxsuspensionService,
    private s_documentos: DocumentosService,
    private coloresService: ColoresService, 
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/habilitaciones');
    let coloresJSON = sessionStorage.getItem('/habilitaciones');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.f_buscarxFechas = this.fb.group({
      desde: [],
      hasta: [],
    });
    this.f_habilitacion = this.fb.group({
      numero: '',
      numdoc: '',
      iddocumento_documentos: '',
      observacion: '',
    });
    this.listarSuspensiones();
    this.getLastHabilitacion();
    this.listarDocumentos();
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'habilitaciones');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/habilitaciones', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  listarSuspensiones() {
    this.suspeService.getListaHabilitaciones().subscribe({
      next: (datos) => {
        console.log(datos);
        this.suspensiones = datos;
      },
      error: (e) => console.error(e),
    });
  }

  buscarxFecha() {
    if (
      this.f_buscarxFechas.value.desde !== null &&
      this.f_buscarxFechas.value.hasta !== null
    ) {
      this.suspeService
        .getListaHabilitacionesByFecha(
          this.f_buscarxFechas.value.desde,
          this.f_buscarxFechas.value.hasta
        )
        .subscribe({
          next: (datos) => {
            this.suspensiones = datos;
          },
          error: (e) => console.error(e),
        });
    } else {
      let i_desde = document.getElementById('desde') as HTMLInputElement;
      let i_hasta = document.getElementById('hasta') as HTMLInputElement;
      i_desde.style.border = '#F54500 1px solid';
      i_hasta.style.border = '#F54500 1px solid';
      setTimeout(() => {
        i_desde.style.border = '';
        i_hasta.style.border = '';
      }, 2000);
    }
  }

  listarDocumentos() {
    this.s_documentos.getListaDocumentos().subscribe({
      next: (datos) => {
        this.l_documentos = datos;
      },
      error: (e) => console.error(e),
    });
  }

  habilitarMedidor() {
    this.abonado.estado = 1;
    this.s_abonado.updateAbonado(this.abonado).subscribe({
      next: (datos) => {
        this.l_habilitaciones = true;
        this.guardarHabilitacion();
      },
      error: (e) => console.error(e),
    });
  }

  getLastHabilitacion() {
    this.suspeService.getUltimo().subscribe({
      next: (datos: any) => {
        this.f_habilitacion.patchValue({
          numero: datos.numero + 1,
        });
      },
    });
  }

  guardarHabilitacion() {
    this.habilitacion.usucrea = this.authService.idusuario;
    this.habilitacion.feccrea = this.date;
    this.habilitacion.numero = this.f_habilitacion.value.numero;
    this.habilitacion.tipo = 2;
    this.habilitacion.fecha = this.date;
    this.habilitacion.numdoc = this.f_habilitacion.value.numdoc;
    this.habilitacion.iddocumento_documentos =
      this.f_habilitacion.value.iddocumento_documentos;
    this.habilitacion.observa = this.f_habilitacion.value.observacion;
    this.habilitacion.total = 1;
    this.suspeService.saveSuspension(this.habilitacion).subscribe({
      next: (datos: any) => {
        this.aboxsuspension.idsuspension_suspensiones = datos;
        this.aboxsuspension.idabonado_abonados = this.abonado;
        this.s_aboxsuspension
          .saveAboxSuspension(this.aboxsuspension)
          .subscribe({
            next: (datos) => {
              window.location.reload();
            },
            error: (e) => console.error(e),
          });
      },
      error: (e) => console.error(e),
    });
  }

  setAbonado(abonado: any) {
    console.log(abonado);
    this.abonado = abonado;
    this.cliente = abonado.idcliente_clientes;
    this.l_habilitaciones = false;
    if (abonado.estado != 1) {
      this.btn_habilitacion = false;
    }
  }

  setEstado(estado: number) {
    let es = this.estado.find(
      (_estado: { valor: number }) => _estado.valor == estado
    );
    return es?.estado;
  }
}
