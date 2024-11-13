import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ColoresService } from 'src/app/compartida/colores.service';
import { FacturaService } from 'src/app/servicios/factura.service';

@Component({
  selector: 'app-cv-facturas',
  templateUrl: './cv-facturas.component.html',
  styleUrls: ['./cv-facturas.component.css'],
})
export class CvFacturasComponent implements OnInit {
  f_buscar: FormGroup;
  filtro: string;
  _facturas: any;
  today: Date = new Date();

  constructor(
    private coloresService: ColoresService,
    private fb: FormBuilder,
    private s_facturas: FacturaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/cv-facturas');
    let coloresJSON = sessionStorage.getItem('/cv-facturas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    let d = this.today.toISOString().slice(0, 10);
    this.f_buscar = this.fb.group({
      sDate: d,
      filtro: '',
    });
    //this.getCarteraOfFacturas(d);
  }
  onChangeDate(e: any) {}

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }
  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'cv-facturas');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/cv-facturas', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }
  getCarteraOfFacturas(date: any) {
    this.s_facturas.getCVFacturaconsumo(date).subscribe({
      next: (facturas: any) => {
        console.log(facturas);
        this._facturas = facturas;
      },
      error: (e: any) => console.error(e),
    });
  }
}
