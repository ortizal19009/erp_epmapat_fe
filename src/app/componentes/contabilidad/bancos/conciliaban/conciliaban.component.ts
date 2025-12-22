import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConciliabanService } from 'src/app/servicios/contabilidad/conciliaban.service';

@Component({
  selector: 'app-conciliaban',
  templateUrl: './conciliaban.component.html',
  styleUrls: ['./conciliaban.component.css']
})
export class ConciliabanComponent implements OnInit {

  conciliaBans: any;

  constructor(   private s_conciliaban: ConciliabanService, private router: Router ) { }

  ngOnInit(): void {
    this.listarConciliaBan();
  }

  listarConciliaBan() {
    this.s_conciliaban.getAllConciliaBancos().subscribe({
      next: (datos) => {
        this.conciliaBans = datos;
      },
      error: (e) => console.error(e),
    });
  }

  nuevaConciliacionBan() {
    this.router.navigate(['add-conciliacion-bancaria']);
  }

}
