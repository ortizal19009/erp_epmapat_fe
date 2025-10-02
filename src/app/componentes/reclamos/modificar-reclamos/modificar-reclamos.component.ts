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
  selector: 'app-modificar-reclamos',
  templateUrl: './modificar-reclamos.component.html',
})
export class ModificarReclamosComponent implements OnInit {
  reclamoForm: FormGroup;
  tpreclamo: any;
  modulos: any;

  constructor(
    public fb: FormBuilder,
    public router: Router,
    public reclamosS: ReclamosService,
    public tpreclamoS: TpReclamoService,
    public modulosS: ModulosService,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    let date: Date = new Date();
    (this.reclamoForm = this.fb.group({
      idreclamo: [''],
      observacion: ['', Validators.required],
      referencia: ['', Validators.required],
      fechaasignacion: ['', Validators.required],
      estado: ['', Validators.required],
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
      estadonotificacion: ['', Validators.required],
      idtpreclamo_tpreclamo: ['', Validators.required],
      idmodulo_modulos: ['', Validators.required],
      usumodi: this.authService.idusuario,
      fecmodi: date,
      usucrea: this.authService.idusuario,
      feccrea: date,
    })),
      this.listarTpReclamo();
    this.listarModulos();
    this.modificarReclamos();
  }
  onSubmit() {
    this.reclamosS.saveReclamos(this.reclamoForm.value).subscribe((datos) => {
      this.mensajeSuccess(this.reclamoForm.value.observacion);
      this.retornarListaReclamos();
    });
  }
  retornarListaReclamos() {
    this.router.navigate(['/reclamos']);
  }

  listarTpReclamo() {
    this.tpreclamoS.getListaTpReclamos().subscribe(
      (datos) => {
        this.tpreclamo = datos;
      },
      (error) => console.log(error)
    );
  }

  listarModulos() {
    this.modulosS.getListaModulos().subscribe(
      (datos) => {
        this.modulos = datos;
      },
      (error) => console.log(error)
    );
  }

  modificarReclamos() {
    let idreclamo = localStorage.getItem('idreclamo');
    this.reclamosS.getListaById(+idreclamo!).subscribe((datos) => {
      this.reclamoForm.setValue({
        idreclamo: datos.idreclamo,
        observacion: datos.observacion,
        referencia: datos.referencia,
        fechaasignacion: datos.fechaasignacion,
        estado: datos.estado,
        referenciadireccion: datos.referenciadireccion,
        piso: datos.piso,
        departamento: datos.departamento,
        fechamaxcontesta: datos.fechamaxcontesta,
        fechacontesta: datos.fechacontesta,
        contestacion: datos.contestacion,
        fechaterminacion: datos.fechaterminacion,
        responsablereclamo: datos.responsablereclamo,
        modulo: datos.modulo,
        notificacion: datos.notificacion,
        estadonotificacion: datos.estadonotificacion,
        idtpreclamo_tpreclamo: datos.idtpreclamo_tpreclamo,
        idmodulo_modulos: datos.idmodulo_modulos,
        usumodi: datos.usumodi,
        fecmodi: datos.fecmodi,
        usucrea: datos.usucrea,
        feccrea: datos.feccrea,
      });
    });
  }

  compararTpReclamo(o1: TpReclamo, o2: TpReclamo): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idtpreclamo == o2.idtpreclamo;
    }
  }

  compararModulos(o1: Modulos, o2: Modulos): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idmodulo == o2.idmodulo;
    }
  }

  mensajeSuccess(n: String) {
    localStorage.setItem(
      'mensajeSuccess',
      'Reclamos <strong>' + n + '</strong> actualizado'
    );
  }
}
