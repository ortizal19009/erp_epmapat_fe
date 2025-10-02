import { Component, OnInit } from '@angular/core';
import { NgControlStatus } from '@angular/forms';
import { Router } from '@angular/router';
import { Abonados } from 'src/app/modelos/abonados';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { AboxsuspensionService } from 'src/app/servicios/aboxsuspension.service';

@Component({
  selector: 'app-detalles-suspensiones',
  templateUrl: './detalles-suspensiones.component.html',
  styleUrls: ['./detalles-suspensiones.component.css']
})

export class DetallesSuspensionesComponent implements OnInit {

  titulo: string = "Detalles suspension";
  f: any;
  l_suspension: any = [];
  l_suspendidos_retirados: any = [];
  numeroSuspension: number;
  nombreDocumento: string;
  abonado: Abonados = new Abonados();
  idsAbonados: any = [];
  abonados_suspendidos: any;
  estado: string;
  l_abonadosSuspendidos: any = [];
  l_abonadosRetirados: any = [];

  constructor(private aboxsuspService: AboxsuspensionService, private router: Router,
    private aboService: AbonadosService) { }

  ngOnInit(): void { this.listarAboxSusp();  }

  listarAboxSusp() {
    let idsuspension = sessionStorage.getItem("idsuspensionToInfo")
    this.aboxsuspService.getByIdsuspension(+idsuspension!).subscribe(datos => {
      let i = 0;
      datos.forEach(() => {
        this.buscarAbonados(datos[i].idabonado_abonados.idabonado)
        i++;
      })
      this.numeroSuspension = datos[0].idsuspension_suspensiones.numero;
      this.nombreDocumento = datos[0].idsuspension_suspensiones.iddocumento_documentos.nomdoc;
      //this.l_suspension = datos;
      let j = 0;
      datos.forEach(() => {
        if (datos[j].idabonado_abonados.estado === 2) {
          this.l_suspension.push(datos[j]);
        } else if (datos[j].idabonado_abonados.estado === 3) {
          this.l_suspendidos_retirados.push(datos[j]);
        }
        j++
      })
    })
  }

  regresar() { this.router.navigate(['suspensiones']);  }

  buscarAbonados(idabonado: number) {
    let suspenderAbonado = 2;
    let i = 0;
    this.aboService.getByidabonado(idabonado).subscribe(datos => {
      datos.forEach(() => {
        if (datos[i].estado === 1) {
          this.actAbonado(datos[i], suspenderAbonado);
        }
        i++;
      })
    })
  }

  actAbonado(abonado: Abonados, estado: number) {
    abonado.estado = estado;
    this.aboService.updateAbonado(abonado).subscribe(datos => {
    })
  }

  abonadosSuspendidos() {
    this.aboService.getByEstado(2).subscribe(datos => {
      this.abonados_suspendidos = datos;
    });
  }

  seleccionarSuspendidos(e: any) {
    if (e.target.checked === true) {
      this.aboService.getListaById(+e.target.value!).subscribe(datos => {
        this.l_abonadosSuspendidos.push(datos);
      })
    } else if (e.target.checked === false) {
      let consulta = this.l_abonadosSuspendidos.find((abonado: { idabonado: number }) => abonado.idabonado === (+e.target.value!))
      let index = this.l_abonadosSuspendidos.indexOf(consulta);
      this.l_abonadosSuspendidos.splice(index, 1);
    }
  }

  seleccionarRetirados(e: any) {
    if (e.target.checked === true) {
      this.aboService.getListaById(+e.target.value!).subscribe(datos => {
        this.l_abonadosRetirados.push(datos);
      })
    } else if (e.target.checked === false) {
      let consulta = this.l_abonadosRetirados.find((abonado: { idabonado: number }) => abonado.idabonado === (+e.target.value!))
      let index = this.l_abonadosRetirados.indexOf(consulta);
      this.l_abonadosRetirados.splice(index, 1);
    }
  }

  retirarMedidor() {
    let i = 0;
    this.l_abonadosSuspendidos.forEach(() => {
      this.l_abonadosSuspendidos[i]
      this.actAbonado(this.l_abonadosSuspendidos[i], 3);
      i++;
    })
  }

  pagar(){  }

}
