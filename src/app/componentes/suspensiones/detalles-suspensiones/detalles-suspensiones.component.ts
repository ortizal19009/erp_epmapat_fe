import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Abonados } from 'src/app/modelos/abonados';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { AboxsuspensionService } from 'src/app/servicios/aboxsuspension.service';

@Component({
  selector: 'app-detalles-suspensiones',
  templateUrl: './detalles-suspensiones.component.html',
  styleUrls: ['./detalles-suspensiones.component.css']
})
export class DetallesSuspensionesComponent implements OnInit {
  titulo: string = 'Detalle de suspension';
  filterTerm: string = '';
  detalleSuspension: any = null;
  cuentasSuspension: any[] = [];
  cuentasRetiro: any[] = [];
  cuentasOtras: any[] = [];
  seleccionadosSuspendidos: any[] = [];
  seleccionadosRetirados: any[] = [];

  constructor(
    private aboxsuspService: AboxsuspensionService,
    private router: Router,
    private aboService: AbonadosService,
    private authService: AutorizaService
  ) { }

  ngOnInit(): void {
    this.listarAboxSusp();
  }

  listarAboxSusp() {
    const idsuspension = sessionStorage.getItem('idsuspensionToInfo');
    if (!idsuspension) {
      return;
    }

    this.aboxsuspService.getByIdsuspension(+idsuspension).subscribe((datos: any[]) => {
      if (!datos?.length) {
        this.detalleSuspension = null;
        this.cuentasSuspension = [];
        this.cuentasRetiro = [];
        this.cuentasOtras = [];
        return;
      }

      this.detalleSuspension = datos[0].idsuspension_suspensiones;
      this.hidratarAbonados(datos);
    });
  }

  private hidratarAbonados(datos: any[]) {
    const requests = datos.map((item) => {
      const idabonado = Number(item?.idabonado_abonados?.idabonado);
      if (!idabonado) {
        return of(item);
      }

      return this.aboService.getById(idabonado);
    });

    forkJoin(requests).subscribe({
      next: (abonadosCompletos: any[]) => {
        const datosEnriquecidos = datos.map((item, index) => ({
          ...item,
          idabonado_abonados: abonadosCompletos[index] ?? item.idabonado_abonados
        }));

        this.cuentasSuspension = datosEnriquecidos.filter((item) => Number(item?.idabonado_abonados?.estado) === 2);
        this.cuentasRetiro = datosEnriquecidos.filter((item) => Number(item?.idabonado_abonados?.estado) === 3);
        this.cuentasOtras = datosEnriquecidos.filter((item) => ![2, 3].includes(Number(item?.idabonado_abonados?.estado)));
      },
      error: () => {
        this.cuentasSuspension = datos.filter((item) => Number(item?.idabonado_abonados?.estado) === 2);
        this.cuentasRetiro = datos.filter((item) => Number(item?.idabonado_abonados?.estado) === 3);
        this.cuentasOtras = datos.filter((item) => ![2, 3].includes(Number(item?.idabonado_abonados?.estado)));
      }
    });
  }

  regresar() {
    this.router.navigate(['suspensiones']);
  }

  actAbonado(abonado: Abonados, estado: number) {
    abonado.estado = estado;
    const tipo = estado === 2 ? 'SUSPENSION' : estado === 3 ? 'RETIRO_MEDIDOR' : 'MODIFICACION';
    this.aboService.updateAbonadoAuditoria(abonado, this.authService.idusuario, tipo, tipo).subscribe();
  }

  seleccionarSuspendidos(e: any) {
    if (e.target.checked === true) {
      this.aboService.getListaById(+e.target.value!).subscribe((datos) => {
        this.seleccionadosSuspendidos.push(datos);
      });
    } else if (e.target.checked === false) {
      const consulta = this.seleccionadosSuspendidos.find(
        (abonado: { idabonado: number }) => abonado.idabonado === (+e.target.value!)
      );
      const index = this.seleccionadosSuspendidos.indexOf(consulta);
      this.seleccionadosSuspendidos.splice(index, 1);
    }
  }

  seleccionarRetirados(e: any) {
    if (e.target.checked === true) {
      this.aboService.getListaById(+e.target.value!).subscribe((datos) => {
        this.seleccionadosRetirados.push(datos);
      });
    } else if (e.target.checked === false) {
      const consulta = this.seleccionadosRetirados.find(
        (abonado: { idabonado: number }) => abonado.idabonado === (+e.target.value!)
      );
      const index = this.seleccionadosRetirados.indexOf(consulta);
      this.seleccionadosRetirados.splice(index, 1);
    }
  }

  retirarMedidor() {
    let i = 0;
    this.seleccionadosSuspendidos.forEach(() => {
      this.actAbonado(this.seleccionadosSuspendidos[i], 3);
      i++;
    });
  }

  pagar() { }

  get totalCuentas(): number {
    return (this.cuentasSuspension?.length ?? 0)
      + (this.cuentasRetiro?.length ?? 0)
      + (this.cuentasOtras?.length ?? 0);
  }

  getEstadoLabel(estado: number): string {
    switch (Number(estado)) {
      case 0:
        return 'Pendiente';
      case 1:
        return 'Activo';
      case 2:
        return 'Suspendido';
      case 3:
        return 'Suspendido y retirado';
      default:
        return `${estado ?? ''}`;
    }
  }
}
