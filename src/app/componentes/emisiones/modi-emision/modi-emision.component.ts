import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Emisiones } from 'src/app/modelos/emisiones.model';
import { EmisionService } from 'src/app/servicios/emision.service';

@Component({
  selector: 'app-modi-emision',
  templateUrl: './modi-emision.component.html'
})

export class ModiEmisionComponent implements OnInit {

  id: number;
  emi: Emisiones = new Emisiones();

  constructor(private emiService:EmisionService,private rutaActiva:ActivatedRoute, private router:Router) { }

  ngOnInit(): void {
    this.id = this.rutaActiva.snapshot.params['idemision']
    this.emiService.getByIdemision(this.id).subscribe(data => {
      this.emi = data;
    }, error => console.log(error));
  }
  
  onSubmit(){
    this.emiService.update(this.id, this.emi).subscribe( data =>{
      this.goToList();
    }
    , error => console.log(error));
  }

  goToList(){
    this.router.navigate(['/emisiones']);
  }

  cancelar(){this.goToList();}
  
}
