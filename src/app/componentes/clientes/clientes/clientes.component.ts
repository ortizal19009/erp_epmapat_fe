import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Clientes } from 'src/app/modelos/clientes';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ClientesService } from 'src/app/servicios/clientes.service';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
})
export class ClientesComponent implements OnInit {
  @ViewChild('labelElement') labelElement: ElementRef<HTMLInputElement>;

  filtro: string;
  formBuscar: FormGroup;
  _clientes: any;
  disabled = true;
  otraPagina: boolean = false;
  tsvData: any[] = [];
  //Para Importar
  _tsvData: any[] = [];
  swfile: Boolean = false;
  swvalido: Boolean;
  sweliminar: boolean;
  clie = {} as Clientes;

  constructor(
    public fb: FormBuilder,
    private clieService: ClientesService,
    private router: Router,
    private coloresService: ColoresService,
    private aboService: AbonadosService,
    public authService: AutorizaService
  ) {}

  ngOnInit(): void {
    // if(!this.authService.log) this.router.navigate(['/inicio']);

    sessionStorage.setItem('ventana', '/clientes');
    let coloresJSON = sessionStorage.getItem('/clientes');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    let buscaClientes = sessionStorage.getItem('buscaClientes');
    if (buscaClientes == null) buscaClientes = '';
    localStorage.removeItem('idclienteToDetalles');

    this.formBuscar = this.fb.group({
      nombreIdentifi: [
        buscaClientes,
        [Validators.required, Validators.minLength(4)],
      ],
      filtro: '',
    });

    let nombreIdentifi = document.getElementById(
      'nombreIdentifi'
    ) as HTMLInputElement;
    nombreIdentifi.addEventListener('keyup', () => {
      if (this.formBuscar.invalid) {
        this.disabled = true;
      } else {
        this.disabled = false;
      }
    });

    if (buscaClientes != '') this.onSubmit();
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'clientes');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/clientes', coloresJSON);
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

  onSubmit() {
    if (
      this.formBuscar.value.nombreIdentifi == '' ||
      this.formBuscar.value.nombreIdentifi == null
    ) {
      this._clientes = [];
    } else {
      this.clieService
        .getByNombreIdentifi(this.formBuscar.value.nombreIdentifi)
        .subscribe({
          next: (datos) => {
            sessionStorage.setItem(
              'buscaClientes',
              this.formBuscar.controls['nombreIdentifi'].value.toString()
            );
            this._clientes = datos;
          },
          error: (err) => console.log(err.error),
        });
    }
  }

  public listarClientes() {
    this.clieService.getListaClientes().subscribe({
      next: (datos) => (this._clientes = datos),
      error: (err) => console.error(err.error),
    });
  }

  eliminarCliente(cliente: Clientes) {
    this.sweliminar = false;
    this.aboService.tieneAbonados(cliente.idcliente).subscribe({
      next: (resp) => {
        this.sweliminar = !resp;
        this.clie.idcliente = cliente.idcliente;
        this.clie.nombre = cliente.nombre;
      },
      error: (err) =>
        console.error('Al buscar los Abonados del Cliente: ', err.error),
    });
  }

  elimina() {
    // this.pregasService.deletePregasto(this.pargasto.idpresupue).subscribe({
    //    next: resp => this.buscar(),
    //    error: err => console.error('Al eliminar la Partida de Gastos: ', err.error),
    // });
  }

  modificarCliente(idcliente: number) {
    sessionStorage.setItem('padreModiCliente', '/clientes');
    sessionStorage.setItem('idclienteToModi', idcliente.toString());
    this.router.navigate(['/modificar-clientes']);
  }

  irAddClientes() {
    this.router.navigate(['add-cliente']);
  }

  detallesCliente(e: any, cliente: Clientes) {
    const tagName = e.target.tagName;
    if (tagName === 'TD') {
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
    this.router.navigate(['imp-clientes']);
  }
  pdf() {
    let m_izquierda = 20;
    var doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('LISTA DE CLIENTES', m_izquierda, 16);

    var datos: any = [];
    let calc: string;
    let swiva: String;
    var i = 0;
    this._clientes.forEach(() => {
      datos.push([
        i + 1,
        this._clientes[i].nombre,
        this._clientes[i].cedula,
        this._clientes[i].direccion,
        this._clientes[i].email,
      ]);
      i++;
    });

    let cabecera = ['', 'NOMBRE', 'CEDULA/RUC', 'DIRECCIÓN', 'E-MAIL'];

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

      didParseCell: function (HookData) {
        let valor = +HookData.cell.text!;
        if (valor == 0) {
          HookData.cell.styles.textColor = [255, 255, 255];
        }
        if (valor < 0) {
          HookData.cell.styles.textColor = [255, 0, 0];
        }

        let x = HookData.cell.text.toString();
        if (
          (HookData.column.index === 3 || HookData.column.index === 4) &&
          x == 'No'
        ) {
          HookData.cell.styles.textColor = [255, 255, 255];
        }
      },
      head: [cabecera],
      body: datos,
    });

    var opciones = {
      filename: 'clientes.pdf',
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    };

    if (this.otraPagina) doc.output('dataurlnewwindow', opciones);
    else {
      const pdfDataUri = doc.output('datauristring');
      //Si ya existe el <embed> primero lo remueve
      const elementoExistente = document.getElementById('idembed');
      if (elementoExistente) {
        elementoExistente.remove();
      }
      //Crea el <embed>
      var embed = document.createElement('embed');
      embed.setAttribute('src', pdfDataUri);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '65%');
      embed.setAttribute('height', '100%');
      embed.setAttribute('id', 'idembed');
      //Agrega el <embed> al contenedor del Modal
      var container: any;
      container = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }

  importar() {
    this.labelElement.nativeElement.innerText = 'Seleccionar';
    this._tsvData = [];
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.labelElement.nativeElement.innerText = file.name;
    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;
      this._tsvData = this.extractData(text);
    };
    reader.readAsText(file);
  }

  private extractData(text: string): any[] {
    const lines = text.split('\n');
    const data: any[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split('\t');
      if (values.length > 1) {
        this.swfile = true;
        const record: any = {};

        record.cuenta = values[0].trim();
        record.medidor = values[1].trim();
        record.abonado = values[2].trim();
        record.anterior = parseInt(values[3].trim());
        record.direccion = values[4].trim();
        record.categoria = values[5].trim();
        record.promedio = parseInt(values[6].trim());
        record.actual = parseInt(values[7].trim());
        record.consumo = parseInt(values[8].trim());
        record.novedades = values[9].trim();
        record.observaciones = values[10].trim();
        record.valido = null;
        data.push(record);
      }
    }
    return data;
  }

  validar() {
    this.swvalido = true;
    for (let i = 0; i < this._tsvData.length; i++) {
      if (this._tsvData[i].consumo > 0) this._tsvData[i].valido = true;
      else {
        this.swvalido = false;
        this._tsvData[i].valido = false;
      }
    }
  }

  cargar() {}
}
