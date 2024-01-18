import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Reclamos } from 'src/app/modelos/reclamos';
import { ReclamosService } from 'src/app/servicios/reclamos.service';

@Component({
  selector: 'app-listar-reclamos',
  templateUrl: './listar-reclamos.component.html'
})

export class ListarReclamosComponent implements OnInit {

  reclamos : any;
  filterTerm: string;
  
  constructor(private reclamosS: ReclamosService, private router: Router) { }

  ngOnInit(): void {
    this.listarReclamos();
  }

  listarReclamos(){
    this.reclamosS.getListaReclamos().subscribe(datos => {
      this.reclamos = datos;
      this.alerta();
    }, error => console.log(error))
  }
  
  modificarReclamos(reclamos:Reclamos){
    localStorage.setItem("idreclamo", reclamos.idreclamo.toString());
    this.router.navigate(['/modificar-reclamo']);
  }

  eliminarReclamos(idreclamo:number){
    localStorage.setItem("idreclamoToDelete", idreclamo.toString());
  }

  aprobarEliminacionReclamo(){
    let idr = localStorage.getItem("idreclamoToDelete");
    this.reclamosS.deleteReclamos(+idr!).subscribe(datos => {
      localStorage.setItem("mensajeSuccess", "Este reclamo fue eliminado");
      this.listarReclamos();
    },error => console.log(error));
    localStorage.removeItem("idreclamoToDelete");
  }

  alerta() {
    let mensaje = localStorage.getItem("mensajeSuccess");
    if (mensaje != null) {
      const divAlerta = document.getElementById("alertaReclamos");
      const alerta = document.createElement("div") as HTMLElement;
      divAlerta?.appendChild(alerta);
      alerta.innerHTML = "<div class='alert alert-success'><strong>EXITO!</strong> <br/>" + mensaje + ".</div>";
      setTimeout(function () {
        divAlerta?.removeChild(alerta);
        localStorage.removeItem("mensajeSuccess");
      }, 2000);
    }
    localStorage.removeItem("mensajeSuccess");
  }
  
  irAddReclamo(){
    this.router.navigate(["/add-reclamo"]);
  }

}

