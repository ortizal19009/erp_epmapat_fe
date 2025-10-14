import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Clientes } from 'src/app/modelos/clientes';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import Swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
})
export class ClientesComponent implements OnInit, AfterViewInit {
  @ViewChild('labelElement') labelElement!: ElementRef<HTMLInputElement>;
  @ViewChild('nombreIdentifi', { static: false })
  nombreIdentifiEl?: ElementRef<HTMLInputElement>;

  filtro = '';
  formBuscar!: FormGroup;
  _clientes: any[] = [];
  disabled = true;
  otraPagina = false;

  // Para Importar
  _tsvData: any[] = [];
  swfile = false;
  swvalido = false;
  sweliminar = false;

  clie = {} as Clientes;
  rolepermission = 1; // 1=lector, 2=editor, 3=admin (ajusta a tu convención)
  ventana = 'clientes';

  constructor(
    public fb: FormBuilder,
    private clieService: ClientesService,
    private router: Router,
    private coloresService: ColoresService,
    private aboService: AbonadosService,
    public authService: AutorizaService
  ) {}

  ngOnInit(): void {
    // 1) CREA EL FORM ANTES DE CUALQUIER AWAIT
    this.formBuscar = this.fb.group({
      nombreIdentifi: ['', [Validators.required, Validators.minLength(4)]],
      filtro: [''],
    });

    // 2) Luego ya puedes hacer lo demás (asíncrono sin bloquear)
    sessionStorage.setItem('ventana', `/${this.ventana}`);

    const coloresJSON = sessionStorage.getItem(`/${this.ventana}`);
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else {
      void this.buscaColor();
    } // NO await en ngOnInit

    // Permisos (también sin await directo)
    if (this.coloresService.rolepermission == null) {
      this.coloresService
        .getRolePermission(this.authService.idusuario, this.ventana)
        .then((rp) => (this.rolepermission = rp))
        .catch(console.error);
    }

    // Estado previo
    const buscaClientes = sessionStorage.getItem('buscaClientes') ?? '';

    // Reactividad
    this.formBuscar.statusChanges.subscribe(
      (st) => (this.disabled = st === 'INVALID')
    );

    this.formBuscar.get('filtro')!.valueChanges.subscribe((v) => {
      this.filtro = (v ?? '').toString();
    });

    // Si había un valor previo, lo aplicas al form (después de CREARLO)
    if (buscaClientes) {
      this.formBuscar.patchValue({ nombreIdentifi: buscaClientes });
      if (buscaClientes.trim().length >= 4) this.onSubmit();
    }
  }

  ngAfterViewInit(): void {
    // Focus en el input al cargar (si tienes #nombreIdentifi en el template)
    this.nombreIdentifiEl?.nativeElement?.focus?.();
  }

  private async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(
        this.authService.idusuario,
        this.ventana
      );
      if (!datos || datos[0] === '0')
        throw new Error('No se encontraron colores para la ventana');
      sessionStorage.setItem(`/${this.ventana}`, JSON.stringify(datos));
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  private colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    document.querySelector('.cabecera')?.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    document.querySelector('.detalle')?.classList.add('nuevoBG2');
  }

  onSubmit() {
    const criterio: string = (this.formBuscar.value?.nombreIdentifi ?? '')
      .toString()
      .trim();
    if (!criterio) {
      this._clientes = [];
      return;
    }

    this.clieService.getByNombreIdentifi(criterio).subscribe({
      next: (datos: any[]) => {
        sessionStorage.setItem(
          'buscaClientes',
          this.formBuscar.controls['nombreIdentifi'].value.toString()
        );
        this._clientes = Array.isArray(datos) ? datos : [];
        this.swal(
          'success',
          `${this._clientes.length} cliente(s) encontrado(s)`
        );
      },
      error: (err) => console.error(err?.error || err),
    });
  }

  listarClientes() {
    this.clieService.getListaClientes().subscribe({
      next: (datos: any[]) =>
        (this._clientes = Array.isArray(datos) ? datos : []),
      error: (err) => console.error(err?.error || err),
    });
  }

  eliminarCliente(cliente: Clientes) {
    this.sweliminar = false;
    this.aboService.tieneAbonados(cliente.idcliente).subscribe({
      next: (resp: boolean) => {
        this.sweliminar = !resp;
        this.clie.idcliente = cliente.idcliente;
        this.clie.nombre = cliente.nombre;
      },
      error: (err) =>
        console.error(
          'Al buscar los Abonados del Cliente: ',
          err?.error || err
        ),
    });
  }

  elimina() {
    // TODO: Implementar delete cliente cuando tengas endpoint
    // this.clieService.delete(clienteId).subscribe({ next: () => this.onSubmit(), error: ... })
  }

  modificarCliente(idcliente: number) {
    sessionStorage.setItem('padreModiCliente', '/clientes');
    sessionStorage.setItem('idclienteToModi', idcliente.toString());
    this.router.navigate(['/modificar-clientes']);
  }

  irAddClientes() {
    this.router.navigate(['add-cliente']);
  }

  detallesCliente(e: MouseEvent, cliente: Clientes) {
    const target = e.target as HTMLElement;
    if (target?.tagName === 'TD') {
      sessionStorage.setItem(
        'buscaClientes',
        this.formBuscar.controls['nombreIdentifi'].value.toString()
      );
      sessionStorage.setItem('padreDetalleAbonado', '2');
      localStorage.setItem('idclienteToDetalles', cliente.idcliente.toString());
      this.router.navigate(['detalles-cliente']);
    }
  }

  imprimir() {
    this.router.navigate(['imp-clientes', 'clientes']);
  }

  pdf() {
    if (!Array.isArray(this._clientes) || this._clientes.length === 0) {
      this.swal('info', 'No hay datos para imprimir');
      return;
    }

    const m_izquierda = 20;
    const doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('LISTA DE CLIENTES', m_izquierda, 16);

    const body = this._clientes.map((c, i) => [
      i + 1,
      c?.nombre ?? '',
      c?.cedula ?? '',
      c?.direccion ?? '',
      c?.email ?? '',
    ]);

    const cabecera = ['', 'NOMBRE', 'CEDULA/RUC', 'DIRECCIÓN', 'E-MAIL'];

    autoTable(doc, {
      theme: 'grid',
      headStyles: {
        fillColor: [109, 110, 15],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'left' },
        2: { halign: 'left' },
        3: { halign: 'left' },
        4: { halign: 'left' },
      },
      margin: { left: m_izquierda - 1, top: 17, right: 20, bottom: 10 },
      head: [cabecera],
      body,
    });

    if (this.otraPagina) {
      // jsPDF no acepta opciones en dataurlnewwindow; se abre directo
      doc.output('dataurlnewwindow');
    } else {
      const pdfDataUri = doc.output('datauristring');
      const existente = document.getElementById('idembed');
      if (existente) existente.remove();

      const embed = document.createElement('embed');
      embed.setAttribute('src', pdfDataUri);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '65%');
      embed.setAttribute('height', '100%');
      embed.setAttribute('id', 'idembed');

      const container = document.getElementById('pdf');
      container?.appendChild(embed);
    }
  }

  importar() {
    if (this.labelElement?.nativeElement)
      this.labelElement.nativeElement.innerText = 'Seleccionar';
    this._tsvData = [];
    this.swfile = false;
    this.swvalido = false;
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    if (this.labelElement?.nativeElement)
      this.labelElement.nativeElement.innerText = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      const text = (reader.result as string) ?? '';
      this._tsvData = this.extractData(text);
      this.swfile = this._tsvData.length > 0;
      this.swvalido = false;
    };
    reader.onerror = () => this.swal('error', 'No se pudo leer el archivo');
    reader.readAsText(file);
  }

  private extractData(text: string): any[] {
    const lines = text
      .replace(/\r/g, '')
      .split('\n')
      .filter((l) => l.trim().length > 0);
    const data: any[] = [];

    for (const line of lines) {
      const values = line.split('\t');
      if (values.length < 2) continue;

      const toInt = (v: string) => {
        const n = parseInt((v ?? '').trim(), 10);
        return isNaN(n) ? 0 : n;
      };

      const record: any = {
        cuenta: (values[0] ?? '').trim(),
        medidor: (values[1] ?? '').trim(),
        abonado: (values[2] ?? '').trim(),
        anterior: toInt(values[3] ?? '0'),
        direccion: (values[4] ?? '').trim(),
        categoria: (values[5] ?? '').trim(),
        promedio: toInt(values[6] ?? '0'),
        actual: toInt(values[7] ?? '0'),
        consumo: toInt(values[8] ?? '0'),
        novedades: (values[9] ?? '').trim(),
        observaciones: (values[10] ?? '').trim(),
        valido: null,
      };
      data.push(record);
    }
    return data;
  }

  validar() {
    this.swvalido = true;
    for (const r of this._tsvData) {
      if (r.consumo > 0) r.valido = true;
      else {
        r.valido = false;
        this.swvalido = false;
      }
    }
  }

  swal(icon: 'success' | 'error' | 'info' | 'warning', mensaje: string) {
    Swal.fire({
      toast: true,
      icon,
      title: mensaje,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }
}
