import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Abonados } from 'src/app/modelos/abonados';
import { Categoria } from 'src/app/modelos/categoria.model';
import { Clientes } from 'src/app/modelos/clientes';
import { Estadom } from 'src/app/modelos/estadom.model';
import { Rutas } from 'src/app/modelos/rutas.model';
import { Tipopago } from 'src/app/modelos/tipopago.model';
import { Ubicacionm } from 'src/app/modelos/ubicacionm.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { EstadomService } from 'src/app/servicios/estadom.service';
import { RutasService } from 'src/app/servicios/rutas.service';
import { TipopagoService } from 'src/app/servicios/tipopago.service';
import { UbicacionmService } from 'src/app/servicios/ubicacionm.service';

@Component({
   selector: 'app-add-abonados',
   templateUrl: './add-abonados.component.html'
}) 

export class AddAbonadosComponent implements OnInit {

   abonado: Abonados = new Abonados();
   abonadoForm: FormGroup;
   f_responsablePago: FormGroup;
   f_clientes: FormGroup;
   categoria: any;
   rutas: any;
   servicios: any;
   ubicacionm: any;
   tipopago: any;
   estadom: any;
   arrServ: number[] = [];
   idabonado: number;
   v_nromedidor: string;
   v_cliente: any;
   cliente: any;
   v_resppago: any;
   v_idresponsable: any;

   constructor(public fb: FormBuilder, private aboService: AbonadosService,
      public categoriaS: CategoriaService, public rutasS: RutasService,
      public clienteS: ClientesService, public ubicacionmS: UbicacionmService,
      public tipopagoS: TipopagoService, public estadomS: EstadomService, public router: Router) { }

   ngOnInit(): void {
      let date: Date = new Date();
      let categoria: Categoria = new Categoria();
      let rutas: Rutas = new Rutas();
      let clientes: Clientes = new Clientes();
      let ubicacionm: Ubicacionm = new Ubicacionm();
      let tipopago: Tipopago = new Tipopago();
      let estadom: Estadom = new Estadom();
      categoria.idcategoria = 1;
      rutas.idruta = 6;
      clientes.idcliente = 1;
      ubicacionm.idubicacionm = 1;
      tipopago.idtipopago = 1;
      estadom.idestadom = 1;
      setTimeout(() => {
         let o_categorias = document.getElementById("id-c" + categoria.idcategoria) as HTMLElement;
         let o_rutas = document.getElementById("id-r" + rutas.idruta) as HTMLElement;
         let o_ubicacionm = document.getElementById("id-um" + ubicacionm.idubicacionm) as HTMLElement;
         let o_tipopago = document.getElementById("id-tp" + tipopago.idtipopago) as HTMLElement;
         let o_estadom = document.getElementById("id-em" + estadom.idestadom) as HTMLElement;
         o_categorias.setAttribute('selected', '');   //OJO: core.mjs:6402 ERROR TypeError: Cannot read properties of null (reading 'setAttribute')
         o_rutas.setAttribute('selected', '');
         o_ubicacionm.setAttribute('selected', '');
         o_tipopago.setAttribute('selected', '');
         o_estadom.setAttribute('selected', '');
      }, 400);
      this.abonadoForm = this.fb.group({
         nromedidor: ['', Validators.required],
         lecturainicial: ['', Validators.required],
         estado: 1,
         fechainstalacion: ['', Validators.required],
         marca: ['', Validators.required],
         secuencia: ['', Validators.required],
         direccionubicacion: ['', Validators.required],
         localizacion: ['', Validators.required],
         observacion: ['', Validators.required],
         departamento: ['', Validators.required],
         piso: ['', Validators.required],
         idresponsable: this.v_idresponsable,
         idcategoria_categorias: categoria,
         idruta_rutas: rutas,
         idcliente_clientes: this.cliente,
         idubicacionm_ubicacionm: ubicacionm,
         idtipopago_tipopago: tipopago,
         idestadom_estadom: estadom,
         medidorprincipal: ['', Validators.required],
         usucrea: 12345,
         feccrea: date,
      });
      this.f_responsablePago = this.fb.group({
         buscarResponsablePago: ['', Validators.required]
      });
      this.f_clientes = this.fb.group({
         buscarCliente: ['', Validators.required]
      });
      this.listarCategorias();
      this.listarUbicacion();
      this.listarEstadom();
      this.listarTipoPago();
      this.listarRutas();
      //this.obtenerValoresResponsablePago();
   }

   listarCategorias() {
      this.categoriaS.getListCategoria().subscribe(datos => {
         this.categoria = datos;
      }, error => console.log(error));
   }

   listarUbicacion() {
      this.ubicacionmS.getAll().subscribe(datos => {
         this.ubicacionm = datos;
      }, error => console.log(error));
   }

   listarTipoPago() {
      this.tipopagoS.getListTipopago().subscribe(datos => {
         this.tipopago = datos
      }, error => console.log(error));;
   }

   listarEstadom() {
      this.estadomS.getListEstadom().subscribe(datos => {
         this.estadom = datos;
      }, error => console.log(error));
   }

   listarRutas() {
      this.rutasS.getListaRutas().subscribe(datos => {
         this.rutas = datos;
      }, error => console.log(error));
   }

   listarAbonado() {
      this.aboService.getListaAbonados().subscribe(datos => {
         let abn = datos;
         let maxId: number[] = [];
         abn.forEach(function (m: any) {
            maxId.push(m.idabonado);
         });
         this.idabonado = Math.max.apply(null, maxId);
      }, error => console.log(error));
   }

   retornarListaAbonados() { this.router.navigate(['/abonados']); }

   guardarAbonado(): void {
      this.abonadoForm.value.idresponsable = this.v_idresponsable;
      this.abonadoForm.value.idcliente_clientes = this.cliente;
      this.aboService.saveAbonado(this.abonadoForm.value).subscribe(datos => {
         this.retornarListaAbonados();
      }, error => console.log(error));
   }

   onSubmit() {
      this.guardarAbonado();
      this.v_nromedidor = this.abonadoForm.value.nromedidor;
   }

   buscarCliente() {
      let i_cliente = document.getElementById("buscarCliente") as HTMLInputElement;
      let inClientes = document.getElementById("idi-cliente") as HTMLElement;
      let p_message = document.createElement("span");
      p_message.style.color = "red";
      inClientes.appendChild(p_message);
      i_cliente.addEventListener('keyup', () => {
         if (i_cliente.value === '') {
            i_cliente.style.border = "#F54500 1px solid";
            p_message.innerHTML = "<strong>Error!.</strong>  El campo de texto no puede estar vacio</br>";
         } else {
            i_cliente.style.border = "";
            p_message.remove();
         }
      })
      if (i_cliente.value === '') {
         i_cliente.style.border = "#F54500 1px solid";
         p_message.innerHTML = "<strong>Error!.</strong>  El campo de texto no puede estar vacio</br>";
      } else {
         i_cliente.style.border = "";
         this.clienteS.getByIdentificacion(this.f_clientes.value.buscarCliente).subscribe(datos => {
            this.v_cliente = datos;
         });
      }
   }

   buscarResponsablePago() {
      let i_buscarResponsablePago = document.getElementById("buscarResponsablePago") as HTMLInputElement;
      let inResponsablePagos = document.getElementById("idi-responsable-pago") as HTMLElement;
      let p_message = document.createElement("span");
      p_message.style.color = "red";
      inResponsablePagos.appendChild(p_message);
      i_buscarResponsablePago.addEventListener('keyup', () => {
         if (i_buscarResponsablePago.value === '') {
            i_buscarResponsablePago.style.border = "#F54500 1px solid";
            p_message.innerHTML = "<strong>Error!.</strong>  El campo de texto no puede estar vacio</br>";
         } else if (i_buscarResponsablePago.value != '') {
            i_buscarResponsablePago.style.border = "";
            p_message.remove()
         }
      });
      if (i_buscarResponsablePago.value === '') {
         i_buscarResponsablePago.style.border = "#F54500 1px solid";
         p_message.innerHTML = "<strong>Error!.</strong>  El campo de texto no puede estar vacio</br>";
         this.v_resppago = [];
      } else if (i_buscarResponsablePago.value != '') {
         i_buscarResponsablePago.style.border = "";
         // this.clienteS.getByDato(this.f_responsablePago.value.buscarResponsablePago).subscribe(datos => {
         this.clienteS.getByIdentificacion(this.f_responsablePago.value.buscarResponsablePago).subscribe(datos => {
            this.v_resppago = datos;
         });
         p_message.remove()
      }
   }

   obtenerValoresResponsablePago(resppago: Clientes) {
      let i_idresponsable = document.getElementById("idresponsable") as HTMLInputElement;
      i_idresponsable.value = resppago.nombre.toString();
      this.v_idresponsable = resppago;
   }

   obtenerValoresClientes(clientes: Clientes) {
      let i_cliente = document.getElementById("idcliente_clientes") as HTMLInputElement;
      i_cliente.value = clientes.nombre.toString();
      this.cliente = clientes;
   }
}
