import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Aguatramite } from 'src/app/modelos/aguatramite.model';
import { Categoria } from 'src/app/modelos/categoria.model';
import { Clientes } from 'src/app/modelos/clientes';
import { Estadom } from 'src/app/modelos/estadom.model';
import { Rutas } from 'src/app/modelos/rutas.model';
import { Tipotramite } from 'src/app/modelos/tipotramite.model';
import { TramiteNuevo } from 'src/app/modelos/tramite-nuevo';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { AboxsuspensionService } from 'src/app/servicios/aboxsuspension.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AguatramiteService } from 'src/app/servicios/aguatramite.service';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { TramiteNuevoService } from 'src/app/servicios/tramite-nuevo.service';
import { TramitesAguaService } from 'src/app/servicios/tramites-agua.service';
import Swal from 'sweetalert2';

@Component({
   selector: 'app-aguatram',
   templateUrl: './aguatram.component.html',
   styleUrls: ['./aguatram.component.css'],
})
export class AguatramComponent implements OnInit {
   aguatamshow: boolean = true;
   retMedidor: boolean = false;
   suspMedidor: boolean = false;
   cambioCategoria: boolean = false;
   cambioMedidor: boolean = false;
   cambioPropietario: boolean = false;
   btnActivate: boolean = true;
   f_datos: FormGroup;
   f_categoria: FormGroup;
   f_nMedidor: FormGroup;
   f_retiroMedidor: FormGroup;
   f_camPropietario: FormGroup;
   f_camMedidor: FormGroup;
   filterTerm: string;
   filterClient: string;
   categorias: any;
   selectClient: Clientes = new Clientes();
   titulo: string = 'Formulario de tramites de Agua';
   abonados: any;
   abonado: Abonados = new Abonados();
   cliente: Clientes = new Clientes();
   estadom: Estadom = new Estadom();
   categoria: Categoria = new Categoria();
   tramitenuevo: TramiteNuevo = new TramiteNuevo();
   ruta: Rutas = new Rutas();
   date: Date = new Date();
   tipoTramite: Tipotramite = new Tipotramite();
   // especificaTramite: EspecificaTramite = new EspecificaTramite();
   observaciones: string = '';
   opciones = [
      { opcion: 'Cuenta', valor: 1 },
      { opcion: 'Nombre o apellido', valor: 2 },
      { opcion: 'Identificación', valor: 3 },
   ];
   _documentos: any;
   _facturas: any;
   aguatramite: Aguatramite = new Aguatramite();

   constructor(
      private actRouter: ActivatedRoute,
      private fb: FormBuilder,
      private s_abonados: AbonadosService,
      private s_aboxdsuspension: AboxsuspensionService,
      private s_categorias: CategoriaService,
      private router: Router,
      private s_tramitenuevo: TramiteNuevoService,
      private s_tramiteagua: TramitesAguaService,
      private s_aguatramite: AguatramiteService,
      private authService: AutorizaService,
      private s_documentos: DocumentosService,
      private s_facturas: FacturaService
   ) { }

   ngOnInit(): void {
      this.estadom.usucrea = this.authService.idusuario;
      this.tramitenuevo.usucrea = this.authService.idusuario;

      sessionStorage.setItem('ventana', '/aguatramite');
      let coloresJSON = sessionStorage.getItem('/aguatramite');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      // console.log(this.abonados);
      let id = this.actRouter.snapshot.paramMap.get('id');
      this.tipoTramite.idtipotramite = +id!;
      // this.especificaTramite.idespecificatramite = +id!;
      switch (+id!) {
         case 1: {
            this.aguatamshow = false;
            break;
         }
         case 2: {
            this.titulo = 'Retiro de medidor - taponamiento';
            this.retMedidor = true;
            break;
         }
         case 3: {
            this.titulo = 'Suspender medidor';
            this.suspMedidor = true;
            break;
         }
         case 4: {
            this.titulo = 'Cambio de medidor';
            this.cambioMedidor = true;
            break;
         }
         case 5: {
            this.titulo = 'Cambio de propietario';
            this.cambioPropietario = true;
            break;
         }
         case 6: {
            this.titulo = 'Traspaso de medidor';
            break;
         }
         case 7: {
            this.titulo = 'Habilitación de cuenta';
            break;
         }
         case 8: {
            this.titulo = 'Nuevo medidor (sin derechos de agua)';
            break;
         }
         case 9: {
            this.titulo = 'Cambio de Categoría';
            this.cambioCategoria = true;
            break;
         }
         default: {
            this.aguatamshow = true;
            break;
         }

      }
      this.f_datos = this.fb.group({ tipoBusqueda: 1, buscarAbonado: '' });
      this.f_categoria = this.fb.group({
         idcategoria_categorias: 1,
         adultomayor: false,
         municipio: false,
         observaciones: '',
         iddocumento_documentos: 1,
         nrodocumento: ''
      });
      this.f_nMedidor = this.fb.group({
         medidormarca: '',
         medidornumero: '',
         codmedidor: '',
         medidordiametro: '',
         medidornroesferas: '',
         observaciones: '',
         iddocumento_documentos: 1,
         nrodocumento: ''
      });
      this.f_retiroMedidor = this.fb.group({
         ubimedidor: ['', Validators.required],
         fecmedidor: ['', Validators.required],
         iddocumento_documentos: 1,
         nrodocumento: ''
      });
      this.f_camPropietario = this.fb.group({
         cliente: '',
         observaciones: '',
         iddocumento_documentos: 1,
         nrodocumento: ''
      });
      const fechaFormateada = this.date.toISOString().split('T')[0]; // "2025-07-29"

      this.f_retiroMedidor.patchValue({
         fecmedidor: fechaFormateada
      });
      this.listarCategorias();
      this.listDocumentos();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1');
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   listarCategorias() {
      this.s_categorias.getListCategoria().subscribe({
         next: (datos) => {
            this.categorias = datos;
         },
         error: (e) => console.error(e),
      });
   }
   listDocumentos() {
      this.s_documentos.getListaDocumentos().subscribe({
         next: (documentos: any) => {
            this._documentos = documentos
         },
         error: (e: any) => console.error(e)
      })
   }

   retiroMedidor() {
      let abonado: Abonados = this.abonado;
      if (abonado.estado === 1 || abonado.estado === 2) {
         abonado.estado = 3;
         this.date = this.f_retiroMedidor.value.fecmedidor;
         this.observaciones = this.f_retiroMedidor.value.ubimedidor;
         this.aguatramite.nrodocumento = this.f_retiroMedidor.value.nrodocumento
         this.aguatramite.iddocumento_documentos = +this.f_retiroMedidor.value.iddocumento_documentos!
         this.guardarAguaTramite(abonado, abonado.nromedidor);
         this.actualizarAbonado(abonado);
      } else if (abonado.estado === 3) {
         alert('CUENTA TAPONADA');
      } else if (abonado.estado === 0) {
         alert('CUENTA ELIMINADA');
      }
   }

   suspenderMedidor() {
      /* Realizar taponamiento */
      let abonado: Abonados = this.abonado;
      if (abonado.estado === 3) {
         alert('ESTE MEDIDOR ESTA TAPONADO');
      } else {
         abonado.estado = 2;
         this.actualizarAbonado(abonado);
         this.guardarAguaTramite(abonado, null);
      }
   }

   actualizarAbonado(abonado: Abonados) {
      abonado.usumodi = this.authService.idusuario;
      abonado.fecmodi = new Date();
      this.s_abonados.updateAbonado(abonado).subscribe({
         next: (datos) => {
            this.regresar();
         },
         error: (e) => console.error(e),
      });
   }

   actualizarCategoria() {
      this.abonado.idcategoria_categorias =
         this.f_categoria.value.idcategoria_categorias;
      this.abonado.adultomayor = this.f_categoria.value.adultomayor;
      this.abonado.municipio = this.f_categoria.value.municipio;
      this.aguatramite.nrodocumento = this.f_categoria.value.nrodocumento
      this.aguatramite.iddocumento_documentos = +this.f_categoria.value.iddocumento_documentos!
      this.observaciones = this.f_categoria.value.observaciones;
      this.actualizarAbonado(this.abonado);
      this.guardarAguaTramite(this.abonado, null);

   }

   regresar() {
      this.router.navigate(['aguatramite']);
   }

   compareCategoria(o1: Categoria, o2: Categoria): boolean {
      if (o1 === undefined && o2 === undefined) {
         return true;
      } else {
         return o1 === null || o2 === null || o1 === undefined || o2 === undefined
            ? false
            : o1.idcategoria == o2.idcategoria;
      }
   }

   actualizarNuevoMedidor() {
      this.abonado.marca = this.f_nMedidor.value.medidormarca;
      this.abonado.nromedidor = this.f_nMedidor.value.medidornumero;
      this.abonado.lecturainicial = 0;
      this.observaciones = this.f_nMedidor.value.observaciones;
      this.aguatramite.nrodocumento = this.f_nMedidor.value.nrodocumento
      this.aguatramite.iddocumento_documentos = +this.f_nMedidor.value.iddocumento_documentos!
      this.actualizarAbonado(this.abonado);
      this.guardarAguaTramite(this.abonado, this.f_nMedidor.value.codmedidor);
      this.regresar();
   }
   get f() {
      return this.f_nMedidor.controls;
   }
   get fp() {
      return this.f_camPropietario.controls;
   }

   guardarAguaTramite(abonado: Abonados, codmedidor: any) {
      this.aguatramite.codmedidor = codmedidor;
      this.aguatramite.comentario = '';
      this.aguatramite.estado = 3;
      this.aguatramite.sistema = 0;
      this.aguatramite.fechaterminacion = this.date;
      this.aguatramite.observacion = this.observaciones;
      this.aguatramite.idtipotramite_tipotramite = this.tipoTramite;
      this.aguatramite.idcliente_clientes = abonado.idcliente_clientes;
      this.aguatramite.usucrea = this.authService.idusuario;
      this.aguatramite.feccrea = this.date;

      this.s_aguatramite.saveAguaTramite(this.aguatramite).subscribe({
         next: (datos) => {
            this.s_tramiteagua.genContratoTramite(datos, this.abonado, this.titulo);
            this.swal("success", "Datos guardados con exito")
         },
         error: (e) => {
            console.error(e);
            this.swal("error", "Error al guardar tramite de agua")
         },
      });
   }

   setClient(cliente: any) {
      this.selectClient = cliente;
   }

   actualizarPropietario() {
      if (this._facturas.length === 0) {

         this.abonado.idcliente_clientes = this.selectClient;
         this.abonado.idresponsable = this.selectClient;
         this.observaciones = this.f_camPropietario.value.observaciones;
         this.aguatramite.nrodocumento = this.f_camPropietario.value.nrodocumento
         this.aguatramite.iddocumento_documentos = +this.f_camPropietario.value.iddocumento_documentos!
         this.actualizarAbonado(this.abonado);
         this.guardarAguaTramite(this.abonado, null);
      } else {
         this.swal("error", "Cuenta tiene facturas pendientes")
      }
   }

   async setAbonado(abonado: any) {
      this.abonado = abonado;
      this.cliente = abonado.idcliente_clientes;
      this.ruta = abonado.idruta_rutas;
      this.categoria = abonado.idcategoria_categorias;
      this.estadom = abonado.idestadom_estadom;

      this.f_categoria.patchValue({
         idcategoria_categorias: abonado.idcategoria_categorias,
         adultomayor: abonado.adultomayor,
         municipio: abonado.municipio,
      });
      if (this.cambioPropietario) {
         let facturas: any = await this.s_facturas.getFacSincobroBycuenta(abonado.idabonado).toPromise();
         console.log(facturas)
         this._facturas = facturas;
      }
   }
   swal(icon: any, mensaje: any) {
      Swal.fire({
         toast: true,
         icon: icon,
         title: mensaje,
         position: 'top-end',
         showConfirmButton: false,
         timer: 3000,
      });
   }
}
