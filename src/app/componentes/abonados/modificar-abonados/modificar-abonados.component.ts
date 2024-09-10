import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
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
  selector: 'app-modificar-abonados',
  templateUrl: './modificar-abonados.component.html',
  styleUrls: ['./modi-abonado.component.css'],
})
export class ModificarAbonadosComponent implements OnInit {
  abonado: Abonados = new Abonados();
  abonadoForm: FormGroup;
  f_responsablePago: FormGroup;
  f_clientes: FormGroup;
  categoria: any;
  ruta: any;
  ubicacionm: any;
  tipopago: any;
  estadom: any;
  v_idabonado: number;
  v_cliente: any;
  cliente: any;
  v_resppago: any;
  v_idresponsable: any;
  setCategoria:any; 

  constructor(
    public fb: FormBuilder,
    private abonadosS: AbonadosService,
    public categoriaS: CategoriaService,
    public rutasS: RutasService,
    public clienteS: ClientesService,
    public ubicacionmS: UbicacionmService,
    public tipopagoS: TipopagoService,
    public estadomS: EstadomService,
    public router: Router,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    let date: Date = new Date();
    this.abonadoForm = this.fb.group({
      idabonado: [''],
      nromedidor: ['', Validators.required],
      lecturainicial: ['', Validators.required],
      estado: [''],
      fechainstalacion: ['', Validators.required],
      marca: ['', Validators.required],
      secuencia: ['', Validators.required],
      direccionubicacion: ['', Validators.required],
      localizacion: ['', Validators.required],
      observacion: ['', Validators.required],
      departamento: ['', Validators.required],
      piso: ['', Validators.required],
      idresponsable: this.v_idresponsable,
      idcategoria_categorias: ['', Validators.required],
      idruta_rutas: ['', Validators.required],
      idcliente_clientes: this.cliente,
      idubicacionm_ubicacionm: ['', Validators.required],
      idtipopago_tipopago: ['', Validators.required],
      idestadom_estadom: ['', Validators.required],
      medidorprincipal: ['', Validators.required],
      usucrea: this.authService.idusuario,
      adultomayor: '',
      municipio: '',
      swalcantarillado: '',
      feccrea: date,
      usumodi: 1,
      fecmodi: date,
    });

    this.f_responsablePago = this.fb.group({
      buscarResponsablePago: ['', Validators.required],
    });

    this.f_clientes = this.fb.group({
      buscarCliente: ['', Validators.required],
    });

    this.listarCategorias();
    this.listarUbicacion();
    this.listarEstadom();
    this.listarTipoPago();
    this.listarRutas();
    this.obtenerAbonado();
  }

  listarCategorias() {
    this.categoriaS.getListCategoria().subscribe(
      (datos) => {
        this.categoria = datos;
      },
      (error) => console.log(error)
    );
  }

  listarUbicacion() {
    this.ubicacionmS.getAll().subscribe(
      (datos) => {
        this.ubicacionm = datos;
      },
      (error) => console.log(error)
    );
  }

  listarTipoPago() {
    this.tipopagoS.getListTipopago().subscribe(
      (datos) => {
        this.tipopago = datos;
      },
      (error) => console.log(error)
    );
  }

  listarEstadom() {
    this.estadomS.getListEstadom().subscribe(
      (datos) => {
        this.estadom = datos;
      },
      (error) => console.log(error)
    );
  }

  listarRutas() {
    this.rutasS.getListaRutas().subscribe(
      (datos) => {
        this.ruta = datos;
      },
      (error) => console.log(error)
    );
  }

  retornar() {
    this.router.navigate(['detalles-abonado']);
  }

  onSubmit() {
    this.abonadoForm.value.idresponsable = this.v_idresponsable;
    this.abonadoForm.value.idcliente_clientes = this.cliente;
    this.abonadosS.updateAbonado(this.abonadoForm.value).subscribe({
      next: (resp) => this.retornar(),
      error: (err) => console.log(err.error),
    });
  }

  obtenerAbonado() {
    let idabonado = sessionStorage.getItem('idabonadoToModi');
    this.abonadosS.getById(+idabonado!).subscribe((datos) => {
      this.setCategoria = datos.idcategoria_categorias.descripcion; 
      this.cliente = datos.idcliente_clientes;
      this.v_idresponsable = datos.idresponsable;
      this.v_idabonado = +idabonado!;
      this.abonadoForm.setValue({
        idabonado: datos.idabonado,
        nromedidor: datos.nromedidor,
        lecturainicial: datos.lecturainicial,
        estado: datos.estado,
        fechainstalacion: datos.fechainstalacion,
        marca: datos.marca,
        secuencia: datos.secuencia,
        direccionubicacion: datos.direccionubicacion,
        localizacion: datos.localizacion,
        observacion: datos.observacion,
        departamento: datos.departamento,
        piso: datos.piso,
        idresponsable: datos.idresponsable.nombre,
        idcategoria_categorias: datos.idcategoria_categorias,
        idruta_rutas: datos.idruta_rutas,
        idcliente_clientes: datos.idcliente_clientes.nombre,
        idubicacionm_ubicacionm: datos.idubicacionm_ubicacionm,
        idtipopago_tipopago: datos.idtipopago_tipopago,
        idestadom_estadom: datos.idestadom_estadom,
        medidorprincipal: datos.medidorprincipal,
        municipio: datos.municipio,
        adultomayor: datos.adultomayor,
        swalcantarillado: datos.swalcantarillado,
        usumodi: datos.usumodi,
        fecmodi: datos.fecmodi,
        usucrea: datos.usucrea,
        feccrea: datos.feccrea,
      });
    });
  }

  cargarDatos() {
    this.v_idabonado = this.abonadoForm.value.idabonado;
  }

  compararCategorias(o1: Categoria, o2: Categoria): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idcategoria == o2.idcategoria;
    }
  }

  compararRutas(o1: Rutas, o2: Rutas): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idruta == o2.idruta;
    }
  }

  compararUbicacion(o1: Ubicacionm, o2: Ubicacionm): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idubicacionm == o2.idubicacionm;
    }
  }

  compararTpPago(o1: Tipopago, o2: Tipopago): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idtipopago == o2.idtipopago;
    }
  }

  compararEstadoM(o1: Estadom, o2: Estadom): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idestadom == o2.idestadom;
    }
  }

  mensajeSuccess(n: String) {
    localStorage.setItem(
      'mensajeSuccess',
      'Abonado <strong>' + n + '</strong> actualizado'
    );
  }

  buscarCliente() {
    let i_cliente = document.getElementById(
      'buscarCliente'
    ) as HTMLInputElement;
    let inClientes = document.getElementById('idi-cliente') as HTMLElement;
    let p_message = document.createElement('span');
    p_message.style.color = 'red';
    inClientes.appendChild(p_message);
    i_cliente.addEventListener('keyup', () => {
      if (i_cliente.value === '') {
        i_cliente.style.border = '#F54500 1px solid';
        p_message.innerHTML =
          '<strong>Error!.</strong>  El campo de texto no puede estar vacio</br>';
      } else {
        i_cliente.style.border = '';
        p_message.remove();
      }
    });
    if (i_cliente.value === '') {
      i_cliente.style.border = '#F54500 1px solid';
      p_message.innerHTML =
        '<strong>Error!.</strong>  El campo de texto no puede estar vacio</br>';
    } else {
      i_cliente.style.border = '';
      // this.clienteS.getByDato(this.f_clientes.value.buscarCliente).subscribe(datos => {
      //    this.v_cliente = datos;
      // });
      p_message.remove();
    }
  }

  buscarResponsablePago() {
    let i_buscarResponsablePago = document.getElementById(
      'buscarResponsablePago'
    ) as HTMLInputElement;
    let inResponsablePagos = document.getElementById(
      'idi-responsable-pago'
    ) as HTMLElement;
    let p_message = document.createElement('span');
    p_message.style.color = 'red';
    inResponsablePagos.appendChild(p_message);
    i_buscarResponsablePago.addEventListener('keyup', () => {
      if (i_buscarResponsablePago.value === '') {
        i_buscarResponsablePago.style.border = '#F54500 1px solid';
        p_message.innerHTML =
          '<strong>Error!.</strong>  El campo de texto no puede estar vacio</br>';
      } else if (i_buscarResponsablePago.value != '') {
        i_buscarResponsablePago.style.border = '';
        p_message.remove();
      }
    });
    if (i_buscarResponsablePago.value === '') {
      i_buscarResponsablePago.style.border = '#F54500 1px solid';
      p_message.innerHTML =
        '<strong>Error!.</strong>  El campo de texto no puede estar vacio</br>';
    } else if (i_buscarResponsablePago.value != '') {
      i_buscarResponsablePago.style.border = '';
      // this.clienteS.getByDato(this.f_responsablePago.value.buscarResponsablePago).subscribe(datos => {
      //    this.v_resppago = datos;
      // });
      p_message.remove();
    }
  }

  obtenerValoresResponsablePago(resppago: Clientes) {
    let i_idresponsable = document.getElementById(
      'idresponsable'
    ) as HTMLInputElement;
    i_idresponsable.value = resppago.nombre.toString();
    this.v_idresponsable = resppago;
  }

  obtenerValoresClientes(clientes: Clientes) {
    this.cliente = clientes;
  }

  setCliente(cliente: any) {
    this.cliente = cliente;
    this.abonadoForm.patchValue({ idcliente_clientes: cliente.nombre });
  }
  setResponsablePago(respPago: any) {
    this.v_idresponsable = respPago;
    this.abonadoForm.patchValue({ idresponsable: respPago.nombre });
  }
}
