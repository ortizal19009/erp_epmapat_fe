import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Abonados } from 'src/app/modelos/abonados';
import { AbonadosService } from 'src/app/servicios/abonados.service';

@Component({
  selector: 'app-buscarabonado',
  templateUrl: './buscarabonado.component.html',
  styleUrls: ['./buscarabonado.component.css']
})

export class BuscarabonadoComponent implements OnInit {

  filterTerm: string;
  abonado: any;
  abonadoSeleccionado: any;
  titulo: string = "Buscar abonado";
  f_abonado: FormGroup;
  @Output() abonadoEvent = new EventEmitter<string>();

  constructor(private fb: FormBuilder, private s_abonados: AbonadosService) { }

  ngOnInit(): void {
    this.f_abonado = this.fb.group({
      catBusqueda: 1,
      buscarAbonado: ['']
    });
    this.tipoBusqueda();
  }

  onSubmit() {
  }

  bAbonado() {
    let cat = (+this.f_abonado.value.catBusqueda!);
    switch (cat) {
      case 1:
        this.s_abonados.getListaByidabonado(this.f_abonado.value.buscarAbonado).subscribe(datos => {
          this.abonado = datos;
        });
        break;
      case 2:
        this.s_abonados.getListaByNombreCliente(this.f_abonado.value.buscarAbonado).subscribe(datos => {
          this.abonado = datos;
        });
        break;
      case 3:
        this.s_abonados.getListaByidentIficacionCliente(this.f_abonado.value.buscarAbonado).subscribe(datos => {
          this.abonado = datos;
        });
        break;
      default:
        break;
    }
  }

  tipoBusqueda() {
    let i_catBusqueda = document.getElementById("selecTipoBusqueda") as HTMLInputElement;
    let i_Busqueda = document.getElementById("buscarAbonado") as HTMLInputElement;
    i_catBusqueda.addEventListener('change', () => {
      this.f_abonado.value.buscarAbonado = '';
      i_Busqueda.value = '';
      this.abonado = [];
    })
  }

  sAbonado(abonado: any) {
    this.abonadoEvent.emit(abonado)
  }

}
