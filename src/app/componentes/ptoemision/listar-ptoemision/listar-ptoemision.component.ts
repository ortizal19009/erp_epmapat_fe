import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Ptoemision } from 'src/app/modelos/ptoemision';
import { PtoemisionService } from 'src/app/servicios/ptoemision.service';

@Component({
  selector: 'app-listar-ptoemision',
  templateUrl: './listar-ptoemision.component.html',
  styleUrls: ['./listar-ptoemision.component.css']
})

export class ListarPtoemisionComponent implements OnInit {

  ptoemision : any;

  constructor(private ptoemiService:PtoemisionService, private router: Router) { }

  ngOnInit(): void {
    this.listarPtoEmision();
  }

  listarPtoEmision(){
    this.ptoemiService.getListaPtoEmision().subscribe(datos => {
       this.ptoemision = datos},error => console.log(error))
  }

  eliminarPtoEmision(idptoemision:number){
    localStorage.setItem("idptoemisionToDelete", idptoemision.toString());
  }

  confirmarEliminarPtoEmision(){
    let idpte = localStorage.getItem("idptoemisionToDelete");
    if(idpte != null){
      this.ptoemiService.getUsedPtoEmision(+idpte!).subscribe(datos =>{
        if(datos.length != 0){
          const divAlerta = document.getElementById("alertaPtoEmision");
          const alerta = document.createElement("div") as HTMLElement;
          divAlerta?.appendChild(alerta);
          alerta.innerHTML = "<div class='alert alert-danger' role='alert'><strong>ERROR!</strong> <br/>Este punto de emision no se lo puede borra, es usado en otra tabla.</div>";
          setTimeout(function () {
            divAlerta?.removeChild(alerta);
            localStorage.removeItem("idptoemisionToDelete");
          }, 2000);

        }
        else{
          this.ptoemiService.deletePtoEmision(+idpte!).subscribe(datos => {
            localStorage.setItem("mensajeSuccess", "Punto de emision eliminado ");
            this.listarPtoEmision();
          },error=>console.log(error));
          
        }
      }, error => console.log(error));
    }
    localStorage.removeItem("idptoemisionToDelete");
    this.listarPtoEmision();
  }

  modificarPtoEmision(ptoemision: Ptoemision){
    localStorage.setItem("idptoemision",ptoemision.idptoemision.toString());
    this.router.navigate(['/modificar-ptoemision']);
  }

  public info(idptoemision: number) {
    sessionStorage.setItem('idptoemisionToInfo', idptoemision.toString());
    this.router.navigate(['info-establecimiento']);
  }

}
