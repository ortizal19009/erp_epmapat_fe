import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { ColoresService } from '@compartida/colores.service';
import { Eliminadosapp } from '@modelos/administracion/eliminadosapp.model';
import { Reportesjr } from '@modelos/administracion/reportesjr.model';
import { EliminadosappService } from '@servicios/administracion/eliminadosapp.service';
import { ReportesjrService } from '@servicios/administracion/reportesjr.service';
import { RepoxopcionService } from '@servicios/administracion/repoxopcion.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reportejr',
  templateUrl: './reportejr.component.html',
  styleUrls: ['./reportejr.component.css']
})
export class ReportesjrComponent implements OnInit {

  formBuscar!: FormGroup;
  swbuscando?: boolean;
  txtbuscar: string = 'Buscar';
  repoxopcion: any[] = [];
  reportesjr: any[] = [];
  suminicial = 0;
  sumreforma = 0;
  sumcodificado = 0;
  sweliminar: boolean = false;
  repojrFiltrados: Reportesjr[] = [];
  ordenColumna: keyof ReportesjrVisual = 'codigo';
  ordenAscendente: boolean = true;
  totalParametros: number[] = [];
  ultIdSelec: number = -1;

  constructor(public fb: FormBuilder, private router: Router, public authService: AutorizaService,
    private coloresService: ColoresService, private repoxopService: RepoxopcionService,
    private repojrService: ReportesjrService, private elimService: EliminadosappService) { }

  ngOnInit(): void {
    if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
    sessionStorage.setItem('ventana', '/reportesjr');
    let coloresJSON = sessionStorage.getItem('/reportesjr');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    //Campos guardados o ''
    this.ultIdSelec = sessionStorage.getItem('ultidreporte') ? Number(sessionStorage.getItem('ultidreporte')) : 0;
    // console.log('ultIdSelec en ngOnInit Reportesjr:', this.ultIdSelec);
    let swbuscar: boolean;
    let codigo: string; let nomrep: string;; let desrep: string;
    const buscarReportesjrJSON = sessionStorage.getItem('buscarReportesjr');
    if (buscarReportesjrJSON) {
      swbuscar = true;
      const buscarReportesjr = JSON.parse(buscarReportesjrJSON);
      codigo = buscarReportesjr.codigo;
      nomrep = buscarReportesjr.nomrep;
      desrep = buscarReportesjr.desrep;
    } else {
      swbuscar = false;
      codigo = '';
      nomrep = '';
      desrep = '';
    }

    this.formBuscar = this.fb.group({
      repoxopcion: codigo,
      nomrep: nomrep,
      desrep: desrep,
      filtroControl: '',
    });

    this.formBuscar.get('filtroControl')?.valueChanges.subscribe((valor: any) => { this.filtrar(valor) });
    if (swbuscar) this.buscar();
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1')
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(this.authService.idusuario!, 'reportesjr');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/reportesjr', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  //Datalist de las opciones (repoxopcion)
  datalistRepoxopcion(e: any) {
    if (e.target.value != '') {
      this.repoxopService.datalist(e.target.value).subscribe({
        next: datos => this.repoxopcion = datos,
        error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar Repoxopcion', err.error); },
      });
    }
  }

  buscar(): void {
    this.swbuscando = true;
    this.txtbuscar = 'Buscando';
    this.formBuscar.get('filtroControl')?.setValue('');
    let codigo = this.formBuscar.value.repoxopcion;
    let nomrep = this.formBuscar.value.nomrep;
    let desrep = this.formBuscar.value.desrep;
    this.repojrService.getByOpcionNomrepyDesrep(codigo, nomrep, desrep).subscribe({
      next: (reportesjr: Reportesjr[]) => {
        this.reportesjr = reportesjr;
        this.calcCantidadPorRegistro()
        this.repojrFiltrados = [...reportesjr];
        //Guarda los campos de búsqueda
        const buscarReportesjr = {
          codigo: this.formBuscar.value.repoxopcion,
          nomrep: this.formBuscar.value.nomrep,
          desrep: this.formBuscar.value.desrep,
        };
        // Verifica si hay al menos un campo con valor para guardar en session
        const camposBusca = Object.values(buscarReportesjr)
          .some(valor => valor !== null && valor !== undefined && valor.toString().trim() !== '');
        if (camposBusca) sessionStorage.setItem('buscarReportesjr', JSON.stringify(buscarReportesjr));
        else sessionStorage.removeItem('buscarReportesjr');
        this.swbuscando = false;
        this.txtbuscar = 'Buscar';
      },
      error: err => {
        console.error('Error al buscar las Opciones:', err.error)
        this.authService.mostrarError('Error al buscar las Opciones', err.error);
      }
    });
  }

  calcCantidadPorRegistro(): void {
    this.totalParametros = []; // reiniciar el arreglo

    for (const r of this.reportesjr) {
      try {
        const safeParametros = JSON.parse(r.parametros || '{}');

        const cantidad = Object.entries(safeParametros).filter(([_, valor]) => {
          const partes = String(valor).split('|');
          return partes.length === 2 && partes[0].includes('.') && partes[1].trim() !== '';
        }).length;

        this.totalParametros.push(cantidad);
      } catch {
        this.totalParametros.push(0); // si el JSON está mal, se guarda 0
      }
    }
  }

  filtrar(valor: any): void {
    const filtro = valor.toLowerCase();
    if (!filtro) {
      if (this.repojrFiltrados.length > 0) this.repojrFiltrados = [...this.reportesjr];
      return;
    }
    this.repojrFiltrados = this.reportesjr.filter(a => {
      return [a.codigo, a.nomrep, a.desrep].some(campo =>
        String(campo).toLowerCase().includes(filtro)
      );
    });
  }

  ordenarPor(campo: keyof ReportesjrVisual): void {
    if (this.ordenColumna === campo) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.ordenColumna = campo;
      this.ordenAscendente = true;
    }

    this.repojrFiltrados.sort((a: any, b: any) => {
      let valorA: any;
      let valorB: any;
      switch (campo) {
        case 'codigo':
          valorA = `${a.repoxopcion.codigo}`;
          valorB = `${b.repoxopcion.codigo}`;
          break;
        case 'opcion':
          valorA = a.repoxopcion.opcion;
          valorB = b.repoxopcion.opcion;
          break;
        default:
          valorA = a[campo];
          valorB = b[campo];
          break;
      }
      if (valorA == null && valorB == null) return 0;
      if (valorA == null) return 1;
      if (valorB == null) return -1;

      const esNumero = typeof valorA === 'number' && typeof valorB === 'number';

      if (esNumero) {
        return this.ordenAscendente ? valorA - valorB : valorB - valorA;
      } else {
        return this.ordenAscendente
          ? String(valorA).localeCompare(String(valorB))
          : String(valorB).localeCompare(String(valorA));
      }
    });
  }

  onCellClick(event: any, reportejr: Reportesjr) {
    const tagName = event.target.tagName;
    this.ultIdSelec = reportejr.idreporte!;
    sessionStorage.setItem('ultidreporte', this.ultIdSelec.toString());
    if (tagName === 'TD') {
      if (reportejr.metodo == 1) {
        const reportejrJson = JSON.stringify(reportejr);
        sessionStorage.setItem('reportejrToImpExp', reportejrJson);
        this.router.navigate(['imp-reportejr']);
      }
    }
  }

  nuevo() { this.router.navigate(['/add-reportejr']); }

  parametros(repo: Reportesjr) {
    let parametros = repo.parametros;

    // Asegura que parametros sea un objeto antes de usar Object.entries
    const safeParametros = (parametros && typeof parametros === 'object') ? parametros : {};

    // Construir filas de la tabla
    const filas = Object.entries(safeParametros)
      .map(([nombre, valor]) => {
        const [tipoCompleto, longitud] = String(valor).split('|');
        const tipoSimple = tipoCompleto.split('.').pop();
        return `<tr><td><strong>${nombre}</strong></td><td>${tipoSimple}</td><td>${longitud}</td></tr>`;
      })
      .join('');

    // Mostrar el modal con tabla
    Swal.fire({
      title: `Parámetros del Reporte: ${repo.nomrep}`,
      // html: `<table style="width:100%; text-align:left; border-collapse:collapse">
      html: `<table class="table table-hover table-bordered table-sm sombra mb-0">
         <thead class="bg-success text-white">
         <tr><th>Parametro</th><th>Tipo</th><th>Longitud</th></tr>
         </thead>
         <tbody class="roboto">
            ${filas}
         </tbody>
         </table> `,
      // icon: 'info',
      confirmButtonText: 'Cerrar',
      customClass: {
        confirmButton: 'btn btn-success',
        popup: 'swaInfo',
        title: 'swafantacyblack',
      }
    });
  }

  modificar(reportejr: Reportesjr): void {
    this.ultIdSelec = reportejr.idreporte!;
    sessionStorage.setItem('ultidreporte', this.ultIdSelec.toString());
    const reportejrJson = JSON.stringify(reportejr);
    sessionStorage.setItem('reportejrToModi', reportejrJson);
    this.router.navigate(['/modi-reportejr']);
  }

  //Datos a eliminar
  eliminar(repo: Reportesjr): void {
    this.ultIdSelec = repo.idreporte!;
    sessionStorage.setItem('ultidreporte', this.ultIdSelec.toString());
    Swal.fire({
      // width: '500px',
      // title: 'Mensaje',
      icon: 'warning',
      title: `Eliminar el Reporte:\n${repo.repoxopcion!.codigo} ${repo.nomrep} ?`,
      // text: 'Eliminar el Reporte:\n ' + repo.repoxopcion!.codigo + ' ' + repo.nomrep + ' ?',
      showCancelButton: true,
      confirmButtonText: '<i class="fa fa-check"></i> Aceptar',
      cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
      customClass: {
        popup: 'eliminar',
        title: 'robotobig',
        confirmButton: 'btn btn-info',
        cancelButton: 'btn btn-info'
      },
    }).then((resultado) => {
      if (resultado.isConfirmed) this.elimina(repo);
    });
  }

  //Elimina
  elimina(repo: Reportesjr) {
    this.repojrService.delete(repo.idreporte!).subscribe({
      next: () => {
        this.buscar();
        let fecha: Date = new Date();
        let eliminado: Eliminadosapp = new Eliminadosapp();
        eliminado.idusuario = this.authService.idusuario!;
        eliminado.modulo = this.authService.moduActual;
        eliminado.fecha = fecha;
        eliminado.routerlink = 'reportesjr';
        eliminado.tabla = 'REPORTESJR';
        eliminado.datos = `${repo.repoxopcion!.codigo} ${repo.nomrep}`;
        this.elimService.save(eliminado).subscribe({
          next: () => {
            this.authService.swal('success', `Reporte ${repo.repoxopcion!.codigo} eliminado con éxito`);
            this.buscar();
          },
          error: err => {
            console.error(err.error);
            this.authService.mostrarError('Error al eliminar', err.error);
          }
        });
      },
      error: err => {
        console.error(err.error);
        this.authService.mostrarError('Error al eliminar', err.error);
      }
    });
  }

  imprimir() {

  }

  cerrar() { this.router.navigate(['/inicio']); }

  nombreMetodo(metodo: number) {
    if (metodo == 1) return 'SQL Directo';
    if (metodo == 2) return 'Colección de Beans';
    if (metodo == 3) return 'Desde el Frontend';
    return ''
  }


}

interface ReportesjrVisual {
  codigo: string;
  opcion: string;
  nomrep: string;
  desrep: string;
}

interface BuscarReportesjr {
  codigo: string;
  nomrep: string;
  desrep: string;
}