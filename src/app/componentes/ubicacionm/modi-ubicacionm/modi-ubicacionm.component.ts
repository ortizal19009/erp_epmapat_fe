import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Ubicacionm } from 'src/app/modelos/ubicacionm.model';
import { UbicacionmService } from 'src/app/servicios/ubicacionm.service';

@Component({
  selector: 'app-modi-ubicacionm',
  templateUrl: './modi-ubicacionm.component.html'
})

export class ModiUbicacionmComponent implements OnInit {

  id!: number;
  ubi: Ubicacionm = new Ubicacionm();

  constructor(private ubiService: UbicacionmService,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.ubiService.getById2(this.id).subscribe(data => {
      this.ubi = data;
    }, error => console.log(error));
  }

  onSubmit(){
    this.ubiService.update(this.id, this.ubi).subscribe( data =>{
      this.goToList();
    }
    , error => console.log(error));
  }

  goToList(){
    this.router.navigate(['/ubicacionm']);
  }

  cancelar(){this.goToList();}
  
}