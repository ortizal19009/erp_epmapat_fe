import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Certificaciones } from 'src/app/modelos/ccertificaciones';
import { CertificacionesService } from 'src/app/servicios/ccertificaciones.service';

@Component({
  selector: 'app-listar-certificaciones',
  templateUrl: './certificaciones.component.html',
  styleUrls: ['certificaciones.component.css'],
})
export class ListarCertificacionesComponent implements OnInit {
  formBuscar: FormGroup;
  _certificaciones: any[] = [];
  filtro: string;

  constructor(
    private coloresService: ColoresService,
    public certiService: CertificacionesService,
    public router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/ccertificaciones');
    let coloresJSON = sessionStorage.getItem('/ccertificaciones');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.formBuscar = this.fb.group({
      desde: '',
      hasta: '',
      cliente: '',
    });

    this.certiService.ultima().subscribe({
      next: (datos) => {
        let hasta: string = '';
        if (sessionStorage.getItem('hastaCertificaciones') != null)
          hasta = sessionStorage.getItem('hastaCertificaciones')!;
        else hasta = datos.numero.toString();

        let desde: string = '';
        if (sessionStorage.getItem('desdeCertificaciones') != null)
          desde = sessionStorage.getItem('desdeCertificaciones')!;
        else desde = (+hasta - 10).toString();

        //  let al: string = '';
        //  if (sessionStorage.getItem("alFacturacion") != null) al = sessionStorage.getItem("alFacturacion")!
        //  else al = datos.feccrea.toString().slice(0, 10)

        //  let del: string = '';
        //  if (sessionStorage.getItem("delFacturacion") != null) del = sessionStorage.getItem("delFacturacion")!
        //  else {
        //     let fechaRestada: Date;
        //     fechaRestada = new Date(datos.feccrea);
        //     fechaRestada.setMonth(fechaRestada.getMonth() - 1);
        //     del = fechaRestada.toISOString().slice(0, 10);
        //  }

        let cliente: string = '';
        if (sessionStorage.getItem('clienteCertificaciones') != null)
          cliente = sessionStorage.getItem('clienteCertificaciones')!;

        this.formBuscar.patchValue({
          desde: desde,
          hasta: hasta,
          cliente: cliente,
        });
        this.buscar();
      },
      error: (err) => console.error(err.error),
    });

    // this.buscar()
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'ccertificaciones');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/ccertificaciones', coloresJSON);
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

  iniDesdeHasta() {
    if (!this.formBuscar.value.cliente) {
      let desde = '';
      if (sessionStorage.getItem('desdeCertificaciones') != null)
        desde = sessionStorage.getItem('desdeCertificaciones')!;
      this.formBuscar.controls['desde'].setValue(desde);
      let hasta = '';
      if (sessionStorage.getItem('hastaCertificaciones') != null)
        hasta = sessionStorage.getItem('hastaCertificaciones')!;
      this.formBuscar.controls['hasta'].setValue(hasta);
    }
  }

  public buscar() {
    let desde = this.formBuscar.value.desde;
    let hasta = this.formBuscar.value.hasta;
    let cliente = this.formBuscar.value.cliente;
    sessionStorage.setItem(
      'clienteCertificaciones',
      this.formBuscar.value.cliente
    );

    if (cliente != '' && cliente != null) {
      this.formBuscar.controls['desde'].setValue('');
      this.formBuscar.controls['hasta'].setValue('');
      this.certiService.getByCliente(cliente).subscribe({
        next: (datos) => (this._certificaciones = datos),
        error: (err) => console.error(err.error),
      });
    } else {
      sessionStorage.setItem(
        'desdeCertificaciones',
        this.formBuscar.value.desde
      );
      sessionStorage.setItem(
        'hastaCertificaciones',
        this.formBuscar.value.hasta
      );
      if (desde == '' || desde == null) desde = 0;
      if (hasta == '' || hasta == null) hasta = 999999999;
      this.certiService.getDesdeHasta(desde, hasta).subscribe({
        next: (datos) => {
          this._certificaciones = datos;
        },
        error: (err) =>
          console.error('Al recuperar las Certificaciones: ', err.error),
      });
    }
  }

  public nuevo() {
    this.router.navigate(['/add-certificacion']);
  }

  modiCertificacion(certificaciones: Certificaciones) {
    sessionStorage.setItem(
      'idcertificacionToModi',
      certificaciones.idcertificacion.toString()
    );
    this.router.navigate(['modi-certificacion']);
  }

  eliminarCertificacion(idcertificacion: number) {
    localStorage.setItem('idcertificacionToDelete', idcertificacion.toString());
  }

  aprobarEliminacionCertificacion() {
    let idc = localStorage.getItem('idcertificacionToDelete');
    this.certiService.deleteCertificaciones(+idc!).subscribe(
      (datos) => {
        localStorage.setItem('mensajeSuccess', 'Certificacion eliminada');
        // this.listarCertificaciones();
      },
      (error) => console.error(error)
    );
    localStorage.removeItem('idcertificacionToDelete');
  }

  alerta() {
    let mensaje = localStorage.getItem('mensajeSuccess');
    if (mensaje != null) {
      const divAlerta = document.getElementById('alertaCertificacion');
      const alerta = document.createElement('div') as HTMLElement;
      divAlerta?.appendChild(alerta);
      alerta.innerHTML =
        "<div class='alert alert-success'><strong>EXITO!</strong> <br/>" +
        mensaje +
        '.</div>';
      setTimeout(function () {
        divAlerta?.removeChild(alerta);
        localStorage.removeItem('mensajeSuccess');
      }, 2000);
    }
    localStorage.removeItem('mensajeSuccess');
  }

  // info(){ this.router.navigate(['/gene-certificacion']);   }
  info(idcertificacion: any) {
    this.router.navigate(['/gene-certificacion', idcertificacion]);
  }
}
