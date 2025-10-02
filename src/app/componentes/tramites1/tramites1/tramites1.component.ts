import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Tramites1 } from 'src/app/modelos/tramites1';
import { RubrosxtramiteService } from 'src/app/servicios/rubrosxtramite.service';
import { Tramites1Service } from 'src/app/servicios/tramites1.service';

@Component({
  selector: 'app-tramites1',
  templateUrl: './tramites1.component.html'
})

export class Tramites1Component implements OnInit {
  b_tramite: FormGroup;
  f_detallestramite : FormGroup;
  filterTerm: String;
  v_tramites: any;
  vd_tramite: any;
  l_rubros:any;

  constructor(private fb: FormBuilder, private router: Router, private s_tramite1: Tramites1Service, 
    private s_rubrosxtramite: RubrosxtramiteService) { 
  }
  
  ngOnInit(): void {
    this.listarTrmites();
    this.f_detallestramite = this.fb.group({
      nrotramtie:'',
      cliente:'',
      abonado:'',
      total:'',
      descripcion: '',
      pagado:''
    });
  }
  
  onSubmit() {}
  
  addTramite(){
    this.router.navigate(['add-tramites1']);
  }

  modificarTramite(tramite:Tramites1){
  }

  eliminarTramite(idtramite: number){}

  detallesTramite(tramite: Tramites1){
    console.log(tramite);
    interface datosTramie{
      nroTramite:number
    }
    this.s_rubrosxtramite.getRubrosByTramite(tramite.idtramite).subscribe(datos=>{
      this.l_rubros = datos;
    },error => console.log(error));
    this.f_detallestramite.setValue({
      nrotramtie:tramite.idtramite,
      cliente: tramite.idcliente_clientes.nombre,
      abonado: tramite.idabonado_abonados.idabonado,
      total: tramite.valor,
      descripcion: tramite.descripcion,
      pagado: 0
    })
  }

  listarTrmites(){
    this.s_tramite1.getListaTramites1().subscribe(datos => {
      this.v_tramites = datos;
    }, error => console.log(error));
  }

}
