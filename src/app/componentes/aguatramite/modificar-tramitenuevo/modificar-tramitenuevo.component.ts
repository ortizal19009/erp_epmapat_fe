import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Aguatramite } from 'src/app/modelos/aguatramite.model';
import { Categoria } from 'src/app/modelos/categoria.model';
import { Estadom } from 'src/app/modelos/estadom.model';
import { Tipopago } from 'src/app/modelos/tipopago.model';
import { Ubicacionm } from 'src/app/modelos/ubicacionm.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { AguatramiteService } from 'src/app/servicios/aguatramite.service';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { TramiteNuevoService } from 'src/app/servicios/tramite-nuevo.service';

@Component({
   selector: 'app-modificar-tramitenuevo',
   templateUrl: './modificar-tramitenuevo.component.html',
   styleUrls: ['./modificar-tramitenuevo.component.css'],
})

export class ModificarTramitenuevoComponent implements OnInit {

   @Input() idTramite: number;

   formTramitenuevo: FormGroup;
   v_aguatramite: any;
   v_categorias: any;
   estadoVia = [
      { valor: 1, estado: 'Tierra' },
      { valor: 2, estado: 'Adoquin' },
      { valor: 3, estado: 'Asfalto' },
      { valor: 4, estado: 'Cemento' },
      { valor: 5, estado: 'Otro' },
   ];
   factibilidad: boolean = true;
   medidor: boolean = true;
   notificado: boolean = true;
   aprobado: boolean = true;
   secuenciaAfectada: number;
   ruta: any;
   date: Date = new Date();
   aguatramite: Aguatramite = new Aguatramite();
   abonado: any;
   v_adultomayor: boolean = false;
   v_municipio: boolean = false;
   _abonado: Abonados = new Abonados();



   constructor(private traminuevoService: TramiteNuevoService, private router: Router,
      private aguatramService: AguatramiteService, private cateService: CategoriaService, private fb: FormBuilder,
      private aboService: AbonadosService, private authService: AutorizaService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/aguatramite');
      let coloresJSON = sessionStorage.getItem('/aguatramite');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formTramitenuevo = this.fb.group({
         idtramitenuevo: [''],
         direccion: ['', Validators.required],
         nrocasa: [{ value: '', disabled: false }, Validators.required],
         nrodepar: [{ value: '', disabled: false }, Validators.required],
         barrio: [{ value: '', disabled: false }, Validators.required],
         referencia: [{ value: '', disabled: false }, Validators.required],
         tuberiaprincipal: ['', Validators.required],
         idcategoria_categorias: ['', Validators.required],
         tipovia: 1,
         inspector: ['', Validators.required],
         areaconstruccion: ['', Validators.required],
         observaciones: ['', Validators.required],
         medidormarca: [{ value: '', disabled: false }, Validators.required],
         medidornumero: [{ value: '', disabled: false }, Validators.required],
         codmedidor: [{ value: '', disabled: false }, Validators.required],
         medidordiametro: [{ value: '', disabled: false }, Validators.required],
         medidornroesferas: [{ value: '', disabled: false }, Validators.required],
         codmedidorvecino: ['', Validators.required],
         secuencia: [{ value: '', disabled: false }, Validators.required],
         fechafinalizacion: [{ value: '', disabled: false }, Validators.required],
         tipopredio: 0,
         presentacedula: 0,
         presentaescritura: 0,
         solicitaagua: '',
         solicitaalcantarillado: '',
         aprobadoagua: [{ value: 0, disabled: false }],
         aprobadoalcantarillado: [{ value: 0, disabled: false }],
         fechainspeccion: '',
         medidorempresa: '',
         notificado: [{ value: '', disabled: false }],
         fechanotificacion: [{ value: '', disabled: false }],
         estado: '',
         /*          adultomayor: false,
                  municipio: false, */
         idaguatramite_aguatramite: ['', Validators.required],
         usucrea: this.authService.idusuario,
         feccrea: this.date,
         usumodi: this.authService.idusuario,
         fecmodi: '',
      });

      this.listarCategorias();
      this.obtenerDatosTramite();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   get f() { return this.formTramitenuevo.controls; }

   retornarListaTramites() { this.router.navigate(['/aguatramite']); }

   listarCategorias() {
      this.cateService.getListCategoria().subscribe({
         next: (datos) => this.v_categorias = datos,
         error: err => console.error(err.error)
      });
   }

   setAbonado(abonado: any) {
      this.ruta = abonado.idruta_rutas;
      this.formTramitenuevo.patchValue({
         codmedidorvecino: abonado.idabonado,
         secuencia: abonado.secuencia + 1,
      });
      this.secuenciaAfectada = abonado.secuencia;
   }

   obtenerDatosTramite() {
      let idtramitenuevo = this.idTramite;
      this.traminuevoService.getListaById(+idtramitenuevo!).subscribe({
         next: (datos: any) => {
            this.formTramitenuevo.setValue({
               idtramitenuevo: datos.idtramitenuevo,
               direccion: datos.direccion,
               nrocasa: datos.nrocasa,
               nrodepar: datos.nrodepar,
               referencia: datos.referencia,
               barrio: datos.barrio,
               tipopredio: datos.tipopredio,
               presentacedula: datos.presentacedula,
               presentaescritura: datos.presentaescritura,
               solicitaagua: datos.solicitaagua,
               solicitaalcantarillado: datos.solicitaalcantarillado,
               aprobadoagua: datos.aprobadoagua,
               aprobadoalcantarillado: datos.aprobadoagua,
               fechainspeccion: datos.fechainspeccion,
               medidorempresa: datos.medidorempresa,
               medidormarca: datos.medidormarca,
               medidornumero: datos.medidornumero,
               medidornroesferas: datos.medidornroesferas,
               tuberiaprincipal: datos.tuberiaprincipal,
               tipovia: datos.tipovia,
               codmedidor: datos.codmedidor,
               codmedidorvecino: '',
               secuencia: datos.secuencia,
               inspector: datos.inspector,
               areaconstruccion: datos.areaconstruccion,
               notificado: datos.notificado,
               fechanotificacion: datos.fechanotificacion,
               observaciones: datos.observaciones,
               estado: datos.estado,
               fechafinalizacion: datos.fechafinalizacion,
               medidordiametro: datos.medidordiametro,
               idcategoria_categorias: datos.idcategoria_categorias,
               idaguatramite_aguatramite: datos.idaguatramite_aguatramite,
               /*                adultomayor: datos.adultomayor,
                              municipio: datos.municipio, */
               usucrea: datos.usucrea,
               feccrea: datos.feccrea,
               usumodi: datos.usumodi,
               fecmodi: datos.fecmodi,
            });
            this.aguatramite = datos.idaguatramite_aguatramite;
            //this.validarFormulario();
         },
         error: (e) => console.error(e),
      });
   }

   onSubmit() {
      this.guardarTramite();
   }

   guardarTramite() {
      this.traminuevoService.saveTramiteNuevo(this.formTramitenuevo.value).subscribe({
         next: (datos) => {
            this.guardarAbonado();
            this.actualizarAguaTramite(3);   //Estado 3
            this.retornarListaTramites();
         },
         error: (e) => console.error('Al guardar en TramiteNuevo: ', e),
      });
   }

   guardarAbonado() {
      let abonado: Abonados = new Abonados();
      let estadom: Estadom = new Estadom();
      let tipopago: Tipopago = new Tipopago();
      let ubicacionm: Ubicacionm = new Ubicacionm();
      ubicacionm.idubicacionm = 1;
      tipopago.idtipopago = 1;
      estadom.idestadom = 1;
      abonado.nromedidor = this.formTramitenuevo.value.medidornumero;
      abonado.lecturainicial = 0;
      abonado.estado = 1;
      abonado.fechainstalacion = this.formTramitenuevo.value.fechafinalizacion;
      abonado.marca = this.formTramitenuevo.value.medidormarca;
      abonado.secuencia = this.formTramitenuevo.value.secuencia;
      abonado.direccionubicacion = this.formTramitenuevo.value.direccion;
      abonado.localizacion = '';
      abonado.observacion = this.formTramitenuevo.value.observaciones;
      abonado.departamento = this.formTramitenuevo.value.nrodepar;
      abonado.piso = this.formTramitenuevo.value.piso;
      abonado.idresponsable = this.formTramitenuevo.value.idaguatramite_aguatramite.idcliente_clientes;
      abonado.idcategoria_categorias = this.formTramitenuevo.value.idcategoria_categorias;
      abonado.idruta_rutas = this.ruta;
      abonado.idcliente_clientes = this.formTramitenuevo.value.idaguatramite_aguatramite.idcliente_clientes;
      abonado.idubicacionm_ubicacionm = ubicacionm;
      abonado.idtipopago_tipopago = tipopago;
      abonado.idestadom_estadom = estadom;
      abonado.usucrea = this.authService.idusuario;
      abonado.feccrea = this.date;
      abonado.medidorprincipal = 0;
      abonado.adultomayor = this.v_adultomayor;
      abonado.municipio = this.v_municipio;

      this.aboService.saveAbonado(abonado).subscribe({
         next: (datos: any) => {
            this._abonado = datos;
         },
         error: (e) => console.error('Al crear el Abonado: ', e),
      });
   }

   compararCategoria(o1: Categoria, o2: Categoria): boolean {
      if (o1 === undefined && o2 === undefined) {
         return true;
      } else {
         return o1 === null || o2 === null || o1 === undefined || o2 === undefined
            ? false
            : o1.idcategoria == o2.idcategoria;
      }
   }

   compararAguaTramite(o1: Aguatramite, o2: Aguatramite): boolean {
      if (o1 === undefined && o2 === undefined) {
         return true;
      } else {
         return o1 === null || o2 === null || o1 === undefined || o2 === undefined
            ? false
            : o1.idaguatramite == o2.idaguatramite;
      }
   }

   aprobadoAgua(e: any) {
      if (e.target.checked === true) {
         this.formTramitenuevo.patchValue({
            aprobadoagua: 1,
         });
      } else if (e.target.checked === false) {
         this.formTramitenuevo.patchValue({
            aprobadoagua: 0,
         });
      }
   }

   aprobadoAlcantarillado(e: any) {
      if (e.target.checked === true) {
         this.formTramitenuevo.patchValue({
            aprobadoalcantarillado: 1,
         });
      } else if (e.target.checked === false) {
         this.formTramitenuevo.patchValue({
            aprobadoalcantarillado: 0,
         });
      }
   }
   adultomayor(e: any) {
      /* if (e.target.checked === true) {
         this.formTramitenuevo.patchValue({
            adultomayor: true,
         });
      } else if (e.target.checked === false) {
         this.formTramitenuevo.patchValue({
            adultomayor: false,
         });
      } */
      this.v_adultomayor = e.target.checked
   }
   municipio(e: any) {
      /* if (e.target.checked === true) {
         this.formTramitenuevo.patchValue({
            municipio: true,
         });
      } else if (e.target.checked === false) {
         this.formTramitenuevo.patchValue({
            municipio: false,
         });
      } */
      this.v_municipio = e.target.checked
   }

   actualizarAguaTramite(estado: number) {
      this.aguatramite.estado = estado;
      this.aguatramService.updateAguatramite(this.aguatramite).subscribe({
         next: (datos) => {
         },
         error: (e) => console.error(e),
      });
   }

}
