import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoitemService } from 'src/app/servicios/catalogoitem.service';
import { UsoitemsService } from 'src/app/servicios/usoitems.service';

@Component({
  selector: 'app-info-usoitems',
  templateUrl: './info-usoitems.component.html',
  styleUrls: ['./info-usoitems.component.css']
})
export class InfoUsoitemsComponent implements OnInit {

  usoitem = {} as Usoitem; //Interface para los datos de Usoitem
  elimdisabled = true;
  noMovimientos: true;
  _catalogoitems: any;
  _movimientos: any;
  _cuentas: any;

  constructor(private router: Router, private usoiService: UsoitemsService,
    private cataiService: CatalogoitemService) { }

  ngOnInit(): void { this.datosUsoitem()  }

  datosUsoitem() {
    let idusoitems = sessionStorage.getItem('idusoitemsToInfo');
    this.usoiService.getUsoitemById(+idusoitems!).subscribe({
       next: resp => {
          this.usoitem.idusoitems = resp.idusoitems;
          this.usoitem.nommodulo = resp.idmodulo_modulos.descripcion;
          this.usoitem.descripcion = resp.descripcion;
          this.usoitem.estado = resp.estado;
          this.usoitem.feccrea = resp.feccrea;
       },
       error: err => console.log(err.error),
    });
    this.catalogoitemsxUsoi(+idusoitems!);
 }

 //Catalogoitems por Usoitems
 catalogoitemsxUsoi(idusoitems: number) {
  this.cataiService.getByIdusoitems(idusoitems).subscribe({
     next: datos => {
        this._catalogoitems = datos;
        if (this._catalogoitems.length == 0) { this.noMovimientos = true; }
     },
     error: err => console.log(err.error)
  })
}
  regresar() { this.router.navigate(['/usoitems']); }

  modiUsoitem() {
    sessionStorage.setItem("idusoitemsToModi", this.usoitem.idusoitems.toString());
    this.router.navigate(['/modi-usoitems']);
 }

 eliminarUsoitem() {
    if (this.usoitem.idusoitems != null) {
       this.usoiService.deleteUsoitem(this.usoitem.idusoitems).subscribe({
          next: resp => this.router.navigate(['/usoitems']),
          error: err => console.log(err.error),
       })
    }
 }

}

interface Usoitem {
  idusoitems: number;
  descripcion: String;
  estado: Boolean;
  feccrea: Date;
  nommodulo: String;
}