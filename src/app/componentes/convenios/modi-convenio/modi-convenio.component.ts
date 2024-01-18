import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Convenios } from 'src/app/modelos/convenios.model';
import { ConvenioService } from 'src/app/servicios/convenio.service';

@Component({
  selector: 'app-modi-convenio',
  templateUrl: './modi-convenio.component.html'
})

export class ModiConvenioComponent implements OnInit {
 
  idconvenio: number;
  conv: Convenios = new Convenios();
  convForm: FormGroup;

  constructor(private convService: ConvenioService, private rutaActiva: ActivatedRoute,
    private router:Router) { }

  ngOnInit(): void {
    this.idconvenio = this.rutaActiva.snapshot.params['idconvenio'];
    this.convService.getById(this.idconvenio).subscribe(data => {
      this.conv = data;
    }, error => console.log(error));
  }

  onSubmit(){
    this.convService.update(this.idconvenio, this.conv).subscribe( data =>{
      this.goToList();
    }
    , error => console.log(error));
  }

  goToList(){
    this.router.navigate(['info-convenio']);
  }

  cancelar(){this.goToList();}

}
