import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Tpidentifica } from 'src/app/modelos/tpidentifica.model';
import { TpidentificaService } from 'src/app/servicios/tpidentifica.service';

@Component({
  selector: 'app-tpidentificas',
  templateUrl: './tpidentificas.component.html'
})

export class TpidentificasComponent implements OnInit {
  v_tpidentifica: Tpidentifica[] = [];

  constructor(private tpis: TpidentificaService, private router: Router) { }

  ngOnInit(): void { this.listarAll(); }

  public listarAll() {
    this.tpis.getAll().subscribe(datos => { this.v_tpidentifica = datos })
    console.log(this.v_tpidentifica.length)
  }
  
  eliminar(idtpidentifica: number) {
    this.tpis.delete(idtpidentifica).subscribe(datos => {
      this.listarAll();
    })
  }

  modificar(tpidentifica: Tpidentifica) {
    localStorage.setItem("idtpidentifica", tpidentifica.idtpidentifica.toString());
    this.router.navigate(['/modificar-tpidentifica']);
  }
}
