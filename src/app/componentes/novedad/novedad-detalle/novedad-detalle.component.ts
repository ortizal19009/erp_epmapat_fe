import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { NovedadesService } from 'src/app/servicios/novedades.service';
import { Novedad } from 'src/app/modelos/novedad.model';

@Component({
  selector: 'app-novedad-detalle',
  templateUrl: './novedad-detalle.component.html'
})

export class NovedadDetalleComponent implements OnInit {

  @Input() viewMode = false;
  // @Input() currentNovedad: Novedad = {
  //   idnovedad: 
  //   descripcion: '',
  //   estado: 1,
  //   usucrea: 1
  // };
  mensaje = '';
  
  constructor(
    private novedadesService: NovedadesService,
    private route: ActivatedRoute,
    private router: Router) { }

    ngOnInit(): void {
      if (!this.viewMode) {
        this.mensaje = '';
//        this.getNovedad(this.route.snapshot.params["id"]);
      }
    }

    // getNovedad(id: string): void {
    //   this.novedadesService.get(id)
    //     .subscribe({
    //       next: (data) => {
    //         this.currentNovedad = data;
    //         console.log(data);
    //       },
    //       error: (e) => console.error(e)
    //     });
    // }

    // updateNovedad(): void {
    //   this.mensaje = '';
    //   this.novedadesService.update(this.currentNovedad.idnovedad, this.currentNovedad)
    //     .subscribe({
    //       next: (res) => {
    //         console.log(res);
    //         this.mensaje = res.message ? res.message : 'Esta Novedad fue actualizada correctamente!';
    //       },
    //       error: (e) => console.error(e)
    //     });
    // }

    // deleteNovedad(): void {
    //   this.novedadesService.delete(this.currentNovedad.idnovedad)
    //     .subscribe({
    //       next: (res) => {
    //         console.log(res);
    //         this.router.navigate(['/novedades']);
    //       },
    //       error: (e) => console.error(e)
    //     });
    // }

  }

