import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Modulos } from 'src/app/modelos/modulos.model';
import { TpReclamo } from 'src/app/modelos/tp-reclamo';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { ReclamosService } from 'src/app/servicios/reclamos.service';
import { TpReclamoService } from 'src/app/servicios/tp-reclamo.service';

@Component({
  selector: 'app-add-reclamos',
  templateUrl: './add-reclamos.component.html',
})
export class AddReclamosComponent implements OnInit {
  reclamoForm: FormGroup;
  tpreclamo: any;
  modulos: any;

  constructor(
    public fb: FormBuilder,
    public router: Router,
    public reclaService: ReclamosService,
    public tpreclamoS: TpReclamoService,
    public modulosS: ModulosService,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    let date: Date = new Date();
    let tpreclamo: TpReclamo = new TpReclamo();
    let modulo: Modulos = new Modulos();
    tpreclamo.idtpreclamo = 1;
    modulo.idmodulo = 1;
    setTimeout(() => {
      let o_tpreclamo = document.getElementById(
        'id-tr' + tpreclamo.idtpreclamo
      ) as HTMLSelectElement;
      let o_modulo = document.getElementById(
        'id-m' + modulo.idmodulo
      ) as HTMLSelectElement;
      o_tpreclamo.setAttribute('selected', '');
      o_modulo.setAttribute('selected', '');
    }, 300);
    (this.reclamoForm = this.fb.group({
      observacion: ['', Validators.required],
      referencia: ['', Validators.required],
      fechaasignacion: ['', Validators.required],
      estado: 1,
      referenciadireccion: ['', Validators.required],
      piso: ['', Validators.required],
      departamento: ['', Validators.required],
      fechamaxcontesta: ['', Validators.required],
      fechacontesta: ['', Validators.required],
      contestacion: ['', Validators.required],
      fechaterminacion: ['', Validators.required],
      responsablereclamo: ['', Validators.required],
      modulo: ['', Validators.required],
      notificacion: ['', Validators.required],
      estadonotificacion: 0,
      idtpreclamo_tpreclamo: tpreclamo,
      idmodulo_modulos: modulo,
      usucrea: this.authService.idusuario,
      feccrea: date,
    })),
      this.listarTpReclamo();
    this.listarModulos();
  }

  onSubmit() {
    this.guardarReclamo();
  }

  guardarReclamo() {
    this.reclaService.saveReclamos(this.reclamoForm.value).subscribe(
      (datos) => {
        this.retornarListaReclamos();
        this.mensajeSuccess(this.reclamoForm.value.observacion);
      },
      (error) => console.error(error)
    );
  }

  retornarListaReclamos() {
    this.router.navigate(['/reclamos']);
  }

  listarTpReclamo() {
    this.tpreclamoS.getListaTpReclamos().subscribe(
      (datos) => {
        this.tpreclamo = datos;
      },
      (error) => console.error(error)
    );
  }

  listarModulos() {
    this.modulosS.getListaModulos().subscribe(
      (datos) => {
        this.modulos = datos;
      },
      (error) => console.error(error)
    );
  }

  mensajeSuccess(n: String) {
    localStorage.setItem('mensajeSuccess', 'Nueva caja añadida ' + n);
    this.reclamoForm.reset();
  }
}
