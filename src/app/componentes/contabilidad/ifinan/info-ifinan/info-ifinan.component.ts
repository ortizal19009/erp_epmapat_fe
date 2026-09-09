import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { Ifinan } from 'src/app/modelos/contabilidad/ifinan.model';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { IfinanService } from 'src/app/servicios/contabilidad/ifinan.service';

@Component({
  selector: 'app-info-ifinan',
  templateUrl: './info-ifinan.component.html',
  styleUrls: ['./info-ifinan.component.css']
})
export class InfoIfinanComponent implements OnInit {
  ifinan?: Ifinan;
  beneficiarios: Beneficiarios[] = [];
  loading = true;

  constructor(private router: Router, private route: ActivatedRoute, private ifinanService: IfinanService,
    private beneficiariosService: BeneficiariosService) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/ifinan');
    const idifinan = Number(this.route.snapshot.paramMap.get('idifinan') || sessionStorage.getItem('idifinanToInfo'));
    if (!Number.isInteger(idifinan) || idifinan <= 0) {
      this.regresar();
      return;
    }

    this.ifinanService.getById(idifinan).subscribe({
      next: (ifinan) => {
        this.ifinan = ifinan;
        this.loading = false;
        this.cargarBeneficiarios(idifinan);
      },
      error: () => this.regresar()
    });
  }

  private cargarBeneficiarios(idifinan: number): void {
    this.beneficiariosService.findByInstitucion(idifinan).subscribe({
      next: (beneficiarios) => this.beneficiarios = beneficiarios,
      error: () => this.beneficiarios = []
    });
  }

  regresar(): void {
    this.router.navigate(['/ifinan']);
  }
}
