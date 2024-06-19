import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { RutasService } from 'src/app/servicios/rutas.service';

@Component({
  selector: 'app-rutasmoras',
  templateUrl: './rutasmoras.component.html',
  styleUrls: ['./rutasmoras.component.css'],
})
export class RutasmorasComponent implements OnInit {
  _ruta: any;
  filterTerm: string;
  today: number = Date.now();
  formSuspensiones: FormGroup;
  titulo: string = 'Abonados en mora';
  abonados: any;
  _lecturas: any;
  _abonados: any;
  _facSinCobro: any;

  constructor(
    private rutaDato: ActivatedRoute,
    private s_lecturas: LecturasService,
    private s_rubroxfac: RubroxfacService,
    private fb: FormBuilder,
    private s_ruta: RutasService,
    private s_abonado: AbonadosService,
    private s_facturas: FacturaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/mora-abonados');
    let coloresJSON = sessionStorage.getItem('/mora-abonados');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    let idruta = this.rutaDato.snapshot.paramMap.get('idruta');
    this.formSuspensiones = this.fb.group({ desde: [], hasta: [] });
    this.getRuta(+idruta!);
    this.getAbonadosByRuta(+idruta!);
  }
  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }
  getRuta(idruta: number) {
    this.s_ruta.getByIdruta(idruta).subscribe({
      next: (rutaDatos: any) => {
        console.log(rutaDatos);
        this._ruta = rutaDatos;
      },
      error: (e) => console.error(e),
    });
  }
  getLecturas(idruta: number) {
    let newDatos: any[] = [];
    this.s_lecturas.findDeudoresByRuta(idruta).subscribe({
      next: async (lecturas: any) => {
        console.log(lecturas);
        this._lecturas = lecturas;
        await lecturas.forEach((item: any) => {
          let newPreFactura: any = [];
          this.s_rubroxfac
            .getByIdfacturaAsync(item.idfactura)
            .then((i: any) => {
              if (i.length > 0) {
                let doc = new jsPDF('p', 'pt', 'a4');
                //newPreFactura.idfactura = i.idfactura;
                //newDatos.push(newPreFactura);
                let findLectura = newPreFactura.find(
                  (lectura: { idlectura: number }) =>
                    lectura.idlectura === item.idlectura
                );
                if (findLectura === undefined) {
                  newPreFactura.push({ item, i });
                  console.log(newPreFactura);
                } else {
                  newPreFactura.push({ ...i });
                }
              }
            })
            .then(async () => {
              console.log('HOLA MUNDO SEGUNDO BLOQUE');
            })
            .catch((e) => console.error(e));
        });
        await console.log(newDatos);
      },
      error: (e) => console.error(e),
    });
  }
  getAbonadosByRuta(idruta: any) {
    this.s_abonado.getByIdrutaAsync(idruta).then((abonados: any) => {
      console.log(abonados);
      this._abonados = abonados;
      //this.getSinCobrar(abonados[0].idabonado);
      /* abonados.forEach((abonado: any) => {
        this.s_facturas.getSinCobrarAboMod(abonado.idabonado).subscribe({
          next: (factura: any) => {
            console.log(factura);
          },
          error: (e) => console.error(e),
        });
      }); */
    });
  }
  getSinCobrar(idabonado: number) {
    this.s_facturas.getSinCobrarAboMod(idabonado).subscribe({
      next: (facSincobro: any) => {
        console.log(facSincobro);
        this._facSinCobro = facSincobro;
        console.log(facSincobro.length);
        return facSincobro.length;
      },
      error: (e) => {
        console.error(e);
      },
    });
  }
}
