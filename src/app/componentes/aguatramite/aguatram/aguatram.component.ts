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
import { AguatramiteService } from 'src/app/servicios/aguatramite.service';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { TramiteNuevoService } from 'src/app/servicios/tramite-nuevo.service';
import { TramitesAguaService } from 'src/app/servicios/tramites-agua.service';

@Component({
   selector: 'app-aguatram',
   templateUrl: './aguatram.component.html',
   styleUrls: ['./aguatram.component.css']
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

   constructor(private actRouter: ActivatedRoute, private fb: FormBuilder, private s_abonados: AbonadosService,
      private s_aboxdsuspension: AboxsuspensionService, private s_categorias: CategoriaService, private router: Router,
      private s_tramitenuevo: TramiteNuevoService, private s_tramiteagua: TramitesAguaService, private s_aguatramite: AguatramiteService, private authService: AutorizaService) { }

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
            this.titulo = 'Retiro de medidor';
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
      this.f_categoria = this.fb.group({ idcategoria_categorias: 1, adultomayor: false, municipio: false });
      this.f_nMedidor = this.fb.group({
         medidormarca: '',
         medidornumero: '',
         codmedidor: '',
         medidordiametro: '',
         medidornroesferas: '',
         observaciones: '',
      });
      this.f_retiroMedidor = this.fb.group({
         ubimedidor: ['', Validators.required],
         fecmedidor: ['', Validators.required],
      });
      this.f_camPropietario = this.fb.group({
         cliente: '',
         observacion: '',
      });

      this.listarCategorias();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
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

   retiroMedidor() {
      let abonado: Abonados = this.abonado;
      if (abonado.estado != 1) {
         console.log('Este medidor ya esta retirado');
      } else {
         this.date = this.f_retiroMedidor.value.fecmedidor;
         this.observaciones = this.f_retiroMedidor.value.ubimedidor;
         this.guardarAguaTramite(abonado, abonado.nromedidor);
      }
   }

   suspenderMedidor() {
      /* Realizar taponamiento */
      let abonado: Abonados = this.abonado;
      if (abonado.estado === 3) {
         console.log('Este medidor esta suspendido');
      } else {
         abonado.estado = 2;
         this.actualizarAbonado(abonado);
         this.guardarAguaTramite(abonado, null);
      }
   }

   actualizarAbonado(abonado: Abonados) {
      this.s_abonados.updateAbonado(abonado).subscribe({
         next: (datos) => {
            console.log('Abonado Actualizado', datos);
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
      this.actualizarAbonado(this.abonado);
      this.guardarAguaTramite(this.abonado, this.f_nMedidor.value.codmedidor);
      this.regresar();
   }
   get f() { return this.f_nMedidor.controls; }


   guardarAguaTramite(abonado: Abonados, codmedidor: any) {
      let aguatramite: Aguatramite = new Aguatramite();
      aguatramite.codmedidor = codmedidor;
      aguatramite.comentario = '';
      aguatramite.estado = 3;
      aguatramite.sistema = 0;
      aguatramite.fechaterminacion = this.date;
      aguatramite.observacion = this.observaciones;
      aguatramite.idtipotramite_tipotramite = this.tipoTramite;
      aguatramite.idcliente_clientes = abonado.idcliente_clientes;
      aguatramite.usucrea = 1;
      aguatramite.feccrea = this.date;
      this.s_aguatramite.saveAguaTramite(aguatramite).subscribe({
         next: (datos) => {
            console.log('TRAMITE GUARDADO', datos);
            this.s_tramiteagua.genContratoTramite(
               datos,
               this.abonado,
               this.titulo
            );
         },
         error: (e) => console.error(e),
      });
   }

   setClient(cliente: any) {
      this.selectClient = cliente;
   }

   actualizarPropietario() {
      this.abonado.idcliente_clientes = this.selectClient;
      this.abonado.idresponsable = this.selectClient;
      this.observaciones = this.f_camPropietario.value.observacion;
      this.actualizarAbonado(this.abonado);
      this.guardarAguaTramite(this.abonado, null);
   }

   setAbonado(abonado: any) {
      console.log(abonado)
      this.abonado = abonado;
      this.cliente = abonado.idcliente_clientes;
      this.ruta = abonado.idruta_rutas;
      this.categoria = abonado.idcategoria_categorias;
      this.estadom = abonado.idestadom_estadom;

      this.f_categoria.patchValue({ idcategoria_categorias: abonado.idcategoria_categorias, adultomayor: abonado.adultomayor, municipio: abonado.municipio })
   }

}
