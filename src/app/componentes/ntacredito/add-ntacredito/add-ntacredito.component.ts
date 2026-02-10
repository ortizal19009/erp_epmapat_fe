import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Clientes } from 'src/app/modelos/clientes';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Ntacredito } from 'src/app/modelos/ntacredito';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { NtacreditoService } from 'src/app/servicios/ntacredito.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-add-ntacredito',
  templateUrl: './add-ntacredito.component.html',
  styleUrls: ['./add-ntacredito.component.css'],
})
export class AddNtacreditoComponent implements OnInit {
  f_ntacredito!: FormGroup;

  _factura: Facturas = new Facturas();
  cliente: Clientes = new Clientes();
  resppago: Clientes = new Clientes();
  _cuenta: Abonados = new Abonados();

  date: Date = new Date();
  valorFactura: number = 0;   // ✅ number
  _documentos: any[] = [];

  formError: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private coloresService: ColoresService,
    private s_factura: FacturaService,
    private authService: AutorizaService,
    private s_rubroxfac: RubroxfacService,
    private loading: LoadingService,
    private s_abonado: AbonadosService,
    private s_ntacredito: NtacreditoService,
    private s_documento: DocumentosService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/add-ntacredito');
    const coloresJSON = sessionStorage.getItem('/add-ntacredito');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.f_ntacredito = this.fb.group({
      nrofactura: [''],
      planilla: [''],
      cliente: [{ value: '', disabled: true }],
      cuenta: [{ value: '', disabled: true }],

      idfactura: [''], // interno

      valor: ['', [Validators.required, Validators.min(0.01)]], // max dinámico luego
      iddocumento_documentos: [null, [Validators.required]],
      refdocumento: ['', [Validators.required, Validators.maxLength(30)]],
      observacion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(300)]],
    });

    this.getAllDocumentos();
    this.updateValorMaxValidator(0); // al inicio
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'add-ntacredito');
      sessionStorage.setItem('/add-ntacredito', JSON.stringify(datos));
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');

    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  getAllDocumentos() {
    this.s_documento.getListaDocumentos().subscribe({
      next: (datos: any[]) => {
        this._documentos = datos ?? [];
        // selecciona el primero si existe
        this.f_ntacredito.patchValue({
          iddocumento_documentos: this._documentos.length ? this._documentos[0] : null,
        });
      },
      error: (e: any) => console.error(e),
    });
  }

  // ✅ ayuda para template
  isInvalid(ctrlName: string): boolean {
    const c = this.f_ntacredito.get(ctrlName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  onCancel() {
    this.router.navigate(['/ntacredito']);
  }

  onSubmit() {
    this.formError = '';

    if (this.valorFactura <= 0) {
      this.formError = 'Debe cargar una factura antes de registrar la nota de crédito.';
      return;
    }

    if (this.f_ntacredito.invalid) {
      this.f_ntacredito.markAllAsTouched();
      this.formError = 'Revise los campos marcados en rojo.';
      return;
    }

    const f = this.f_ntacredito.getRawValue();

    const ntacredito: Ntacredito = new Ntacredito();
    ntacredito.valor = +f.valor;
    ntacredito.observacion = f.observacion;
    ntacredito.idcliente_clientes = this.resppago;
    ntacredito.feccrea = this.date;
    ntacredito.usucrea = this.authService.idusuario;
    ntacredito.devengado = 0;

    // ojo: tú estabas usando nrofactura = f.idfactura (raro). Te dejo lo correcto:
    ntacredito.nrofactura = f.idfactura; // si en tu backend “nrofactura” guarda idfactura, déjalo así.
    // si en realidad debería ser el número:
    // ntacredito.nrofactura = this._factura?.nrofactura;

    ntacredito.idabonado_abonados = this._cuenta;
    ntacredito.iddocumento_documentos = f.iddocumento_documentos;
    ntacredito.refdocumento = f.refdocumento;

    this.s_ntacredito.saveNtacredito(ntacredito).subscribe({
      next: () => this.router.navigate(['/ntacredito']),
      error: (e: any) => {
        console.error(e);
        this.formError = 'No se pudo guardar la nota de crédito. Revise e intente nuevamente.';
      }
    });
  }

  clearInput(name: 'nrofactura' | 'planilla') {
    this.formError = '';
    this._factura = new Facturas();
    this.cliente = new Clientes();
    this.resppago = new Clientes();
    this._cuenta = new Abonados();

    this.valorFactura = 0;
    this.updateValorMaxValidator(0);

    this.f_ntacredito.patchValue({
      cliente: '',
      cuenta: '',
      idfactura: '',
      valor: '',
    });

    this.f_ntacredito.get(name)?.setValue('');
  }

  getPlanilla() {
    this.formError = '';
    const formulario = this.f_ntacredito.getRawValue();

    if (!formulario.nrofactura && !formulario.planilla) {
      this.formError = 'Ingrese Nro.Factura o Planilla para buscar.';
      return;
    }

    this.loading.showLoading();

    if (formulario.nrofactura) {
      this.s_factura.getByNrofactura(formulario.nrofactura).subscribe({
        next: (planilla: any) => {
          if (planilla?.length === 1) {
            this.setFactura(planilla[0]);
          } else {
            this.formError = 'No se encontró una factura única con ese número.';
            this.loading.hideLoading();
          }
        },
        error: (e: any) => {
          console.error(e);
          this.formError = 'Error consultando la factura por número.';
          this.loading.hideLoading();
        }
      });
      return;
    }

    if (formulario.planilla) {
      this.s_factura.getById(formulario.planilla).subscribe({
        next: (planilla: any) => {
          // tu regla: solo cobradas y activas
          if (planilla?.pagado === 1 && (planilla?.estado === 1 || planilla?.estado === 3)) {
            this.setFactura(planilla);
          } else {
            this.formError = 'Nota de crédito solo para facturas ya cobradas.';
            this.loading.hideLoading();
          }
        },
        error: (e: any) => {
          console.error(e);
          this.formError = 'Error consultando la factura por planilla.';
          this.loading.hideLoading();
        }
      });
    }
  }

  private setFactura(planilla: any) {
    this._factura = planilla;
    this.cliente = planilla.idcliente;
    this.resppago = planilla.idcliente;

    this.buscarAbonado(planilla.idabonado);

    this.f_ntacredito.patchValue({
      cliente: planilla.idcliente?.nombre ?? '',
      idfactura: planilla.idfactura,
      cuenta: planilla.idabonado,
      nrofactura: planilla.nrofactura ?? this.f_ntacredito.get('nrofactura')?.value,
    });

    this.getValorPlanilla(planilla.idfactura);
  }

  getValorPlanilla(idfactura: any) {
    this.s_rubroxfac.getSumaValoresUnitarios(idfactura).then((valor: any) => {
      const v = Number(valor ?? 0);
      this.valorFactura = v; // ✅ number

      this.updateValorMaxValidator(this.valorFactura);

      // si quieres autollenar el valor por defecto (máximo):
      this.f_ntacredito.patchValue({ valor: v.toFixed(2) });

      this.loading.hideLoading();
    }).catch((e: any) => {
      console.error(e);
      this.formError = 'No se pudo calcular el valor de la factura.';
      this.loading.hideLoading();
    });
  }

  private updateValorMaxValidator(maxValue: number) {
    const c = this.f_ntacredito.get('valor');
    if (!c) return;

    const validators = [Validators.required, Validators.min(0.01)];
    if (maxValue > 0) validators.push(Validators.max(maxValue));
    c.setValidators(validators);
    c.updateValueAndValidity({ emitEvent: false });
  }

  buscarAbonado(cuenta: number) {
    this.s_abonado.getById(cuenta).subscribe({
      next: (cuenta: any) => {
        this._cuenta = cuenta;
      },
      error: (e: any) => console.error(e),
    });
  }

  setCliente(dato: any) {
    this.resppago = dato;
    this.f_ntacredito.patchValue({ cliente: dato?.nombre ?? '' });
  }

  setAbonado(dato: any) {
    this.resppago = dato.idresponsable;
    this._cuenta = dato;

    this.f_ntacredito.patchValue({
      cuenta: dato.idabonado,
      cliente: dato.idresponsable?.nombre ?? '',
    });
  }
}
