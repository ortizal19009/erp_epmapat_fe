import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Clientes } from 'src/app/modelos/clientes';
import { ClientesService } from 'src/app/servicios/clientes.service';

@Component({
  selector: 'app-buscar-cliente',
  templateUrl: './buscar-cliente.component.html',
  styleUrls: ['./buscar-cliente.component.css'],
})
export class BuscarClienteComponent implements OnInit {
  @Output() setCliente: EventEmitter<any> = new EventEmitter();

  formBusClientes: FormGroup;
  _clientes: any;
  // btn_search: boolean = true;
  filtro: string;
  ventana: string = 'buscar-cliente';
  rolepermission: number;

  constructor(
    private clieService: ClientesService,
    private fb: FormBuilder,
    private coloresService: ColoresService,
    private authService: AutorizaService
  ) {}

  async ngOnInit(): Promise<void> {
    this.formBusClientes = this.fb.group({
      // nomidenti: ['', Validators.required],
      nombre_identifica: [null, [Validators.required, Validators.minLength(5)]],
    });
    if (
      this.coloresService.rolepermission == undefined ||
      this.coloresService.rolepermission == null
    ) {
      this.rolepermission = await this.coloresService.getRolePermission(
        this.authService.idusuario,
        this.ventana
      );
    }
  }

  // buscarCliente() {
  //   let val = this.formBusClientes.value.nomidenti;
  //   if (val === '' || val === null || val === undefined) {
  //     this.validar(null);
  //   } else {
  //     this.clieService.getByNombreIdentifi(this.formBusClientes.value.nomidenti).subscribe({
  //       next: (datos) => {
  //         this._clientes = datos;
  //       },
  //       error: (e) => console.error(e),
  //     });
  //   }
  // }

  // validar(e: any) {
  //   if (
  //     e.target.value === '' ||
  //     e.target.value === null ||
  //     e.target.value === undefined
  //   ) {
  //     e.target.style.border = 'red 1px solid';
  //     this.btn_search = true;
  //     setTimeout(() => {
  //       e.target.style.border = '';
  //     }, 3000);
  //   } else {
  //     this.btn_search = false;
  //   }
  // }

  getClienteValue(cliente: Clientes) {
    this.setCliente.emit(cliente);
  }

  buscarClientes() {
    if (
      this.formBusClientes.value.nombre_identifica != null &&
      this.formBusClientes.value.nombre_identifica != ''
    ) {
      this.clieService
        .getByNombreIdentifi(this.formBusClientes.value.nombre_identifica)
        .subscribe({
          next: (datos) => (this._clientes = datos),
          error: (err) => console.error(err.error),
        });
    }
  }

  selecCliente(cli: Clientes) {
    // this.formFacturacion.controls['cliente'].setValue(cli.nombre);
    // this.cliente = cli;
  }
}
