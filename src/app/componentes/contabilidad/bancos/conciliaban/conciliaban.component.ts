import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConciliaBanService } from 'src/app/servicios/contabilidad/concilia-ban.service';

@Component({
  selector: 'app-conciliaban',
  templateUrl: './conciliaban.component.html',
  styleUrls: ['./conciliaban.component.css']
})
export class ConciliabanComponent implements OnInit {

  conciliaBans: any;

  constructor(   private s_conciliaban: ConciliaBanService, private router: Router ) { }

  ngOnInit(): void {
    this.listarConciliaBan();
  }

  listarConciliaBan() {
    this.s_conciliaban.getAllConciliaBancos().subscribe({
      next: (datos) => {
        console.log(datos);
        this.conciliaBans = datos;
      },
      error: (e) => console.error(e),
    });
  }

  nuevaConciliacionBan() {
    this.router.navigate(['add-conciliacion-bancaria']);
  }

}
