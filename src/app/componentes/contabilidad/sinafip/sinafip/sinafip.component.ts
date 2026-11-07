import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { firstValueFrom } from 'rxjs';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ArchivoSinafip, AsignacionSinafip, ResultadoSinafip, SinafipService } from 'src/app/servicios/contabilidad/sinafip.service';

@Component({
  selector: 'app-sinafip',
  templateUrl: './sinafip.component.html',
  styleUrls: ['./sinafip.component.css'],
})
export class SinafipComponent implements OnInit {
  formSinafip!: FormGroup;
  resultado: ResultadoSinafip | null = null;
  generando = false;
  asignaciones: AsignacionSinafip[] | null = null;
  cuentas: { codcue: string; nomcue: string }[] = [];
  guardandoAsignacion: number | null = null;
  error = '';
  comparacion: { nombre: string; anteriores: number; iguales: number; soloAnterior: string[]; soloActual: string[] } | null = null;
  readonly archivos: { valor: ArchivoSinafip; nombre: string; descripcion: string }[] = [
    { valor: 'apertura', nombre: 'Apertura inicial', descripcion: 'Saldos de apertura agrupados por cuenta SINAFIP.' },
    { valor: 'detalle-apertura', nombre: 'Detalle de apertura inicial', descripcion: 'Distribuciones por cuenta y beneficiario de los asientos de apertura.' },
    { valor: 'balance', nombre: 'Balance de comprobación', descripcion: 'Apertura, movimientos acumulados desde enero y saldos al cierre del mes.' },
    { valor: 'reciprocas', nombre: 'Transacciones recíprocas', descripcion: 'Movimientos del mes, beneficiarios y cuentas de contrapartida.' },
    { valor: 'presupuesto', nombre: 'Presupuesto inicial', descripcion: 'Asignación inicial por partida de ingreso y gasto.' },
    { valor: 'cedula', nombre: 'Cédula de ingresos y gastos', descripcion: 'Presupuesto inicial, reformas y ejecución acumulada al cierre del mes.' },
  ];
  readonly meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  constructor(private fb: FormBuilder, private coloresService: ColoresService,
    private authService: AutorizaService, private sinafipService: SinafipService) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/sinafip');
    const colores = sessionStorage.getItem('/sinafip');
    if (colores) this.colocaColor(JSON.parse(colores)); else this.buscaColor();
    this.formSinafip = this.fb.group({
      archivo: ['apertura', Validators.required],
      nombre: ['AI', [Validators.required, Validators.pattern(/^[^<>:"/\\|?*\x00-\x1f]+$/)]],
      tipo: ['txt', Validators.required],
      anio: [this.authService.anio, [Validators.required, Validators.min(2000), Validators.max(2100), Validators.pattern(/^\d{4}$/)]],
      periodo: [1, [Validators.required, Validators.min(1), Validators.max(12)]],
    });
    this.formSinafip.get('archivo')!.valueChanges.subscribe((archivo: ArchivoSinafip) => {
      const prefijos: Record<ArchivoSinafip, string> = { apertura: 'AI', 'detalle-apertura': 'DAI', balance: 'BC', reciprocas: 'TR', presupuesto: 'PI', cedula: 'CIG' };
      this.formSinafip.patchValue({ nombre: prefijos[archivo] }, { emitEvent: false });
      this.invalidar();
    });
    ['anio', 'periodo'].forEach(campo => this.formSinafip.get(campo)!.valueChanges.subscribe(() => this.invalidar()));
  }

  get f() { return this.formSinafip.controls; }
  get esInicial(): boolean { return ['apertura', 'detalle-apertura', 'presupuesto'].includes(this.f['archivo'].value); }
  get esReciprocas(): boolean { return this.f['archivo'].value === 'reciprocas'; }
  get totalFilas(): number { return this.resultado?.bloques.reduce((total, bloque) => total + bloque.filas.length, 0) || 0; }

  invalidar(): void { this.resultado = null; this.comparacion = null; this.asignaciones = null; this.error = ''; }

  async buscaColor(): Promise<void> {
    try {
      const colores = await this.coloresService.setcolor(this.authService.idusuario, 'sinafip');
      sessionStorage.setItem('/sinafip', JSON.stringify(colores));
      this.colocaColor(colores);
    } catch { /* La generacion no depende del tema visual. */ }
  }

  colocaColor(colores: string[]): void {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
  }

  async generar(descargar = true): Promise<void> {
    if (this.generando) return;
    if (this.f['anio'].invalid || this.f['periodo'].invalid || (descargar && this.f['nombre'].invalid)) {
      this.formSinafip.markAllAsTouched(); return;
    }
    this.generando = true;
    this.error = '';
    try {
      if (!this.resultado) this.resultado = await firstValueFrom(this.sinafipService.generar(
        this.f['archivo'].value, Number(this.f['anio'].value), this.esInicial ? 1 : Number(this.f['periodo'].value)));
      if (descargar) {
        if (this.f['tipo'].value === 'txt') this.descargarTxt(this.resultado);
        else await this.descargarExcel(this.resultado);
      }
    } catch (error: any) {
      this.resultado = null;
      this.error = error?.error?.message || 'No se pudo generar el archivo. Comprueba la conexión con el backend e intenta nuevamente.';
    } finally { this.generando = false; }
  }

  async revisarAsignaciones(): Promise<void> {
    if (this.generando || this.f['anio'].invalid || this.f['periodo'].invalid) return;
    this.generando = true;
    this.error = '';
    try {
      const [filas, cuentas] = await Promise.all([
        firstValueFrom(this.sinafipService.asignaciones(Number(this.f['anio'].value), Number(this.f['periodo'].value))),
        firstValueFrom(this.sinafipService.cuentas())
      ]);
      this.asignaciones = filas;
      this.cuentas = cuentas;
    } catch (error: any) { this.error = error?.error?.message || 'No se pudieron cargar las asignaciones.'; }
    finally { this.generando = false; }
  }

  async guardarAsignacion(fila: AsignacionSinafip): Promise<void> {
    if (this.guardandoAsignacion !== null) return;
    this.guardandoAsignacion = fila.idregistro;
    this.error = '';
    try {
      await firstValueFrom(this.sinafipService.asignar(fila));
      fila.guardado = true;
      this.resultado = null;
      this.comparacion = null;
    } catch (error: any) { this.error = error?.error?.message || 'No se pudo guardar la asignación.'; }
    finally { this.guardandoAsignacion = null; }
  }

  texto(resultado: ResultadoSinafip): string {
    const filas = resultado.bloques.flatMap(bloque => bloque.filas);
    return filas.length ? filas.map(fila => fila.join('|')).join('\r\n') + '\r\n' : '';
  }

  async compararArchivo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo || !this.resultado) return;
    if (archivo.size > 10 * 1024 * 1024) { this.error = 'El archivo de referencia supera los 10 MB.'; input.value = ''; return; }
    const buffer = await archivo.arrayBuffer();
    let texto: string;
    try { texto = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
    catch { texto = new TextDecoder('windows-1252').decode(buffer); }
    this.compararTexto(texto, archivo.name);
    input.value = '';
  }

  compararTexto(texto: string, nombre: string): void {
    if (!this.resultado) return;
    const anteriores = texto.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/);
    if (anteriores[anteriores.length - 1] === '') anteriores.pop();
    const actuales = this.resultado.bloques.flatMap(bloque => bloque.filas.map(fila => fila.join('|')));
    const pendientes = new Map<string, number>();
    actuales.forEach(fila => pendientes.set(fila, (pendientes.get(fila) || 0) + 1));
    const soloAnterior: string[] = [];
    let iguales = 0;
    anteriores.forEach(fila => {
      const cantidad = pendientes.get(fila) || 0;
      if (cantidad) { pendientes.set(fila, cantidad - 1); iguales++; } else soloAnterior.push(fila);
    });
    const soloActual: string[] = [];
    pendientes.forEach((cantidad, fila) => { for (let i = 0; i < cantidad; i++) soloActual.push(fila); });
    this.comparacion = { nombre, anteriores: anteriores.length, iguales, soloAnterior, soloActual };
  }

  nombreArchivo(extension: string): string {
    const base = this.f['nombre'].value.trim().replace(/\.(txt|xlsx)$/i, '');
    const mes = String(this.resultado?.periodo || 1).padStart(2, '0');
    return `${base}_${this.resultado?.anio}_${mes}.${extension}`;
  }

  descargarTxt(resultado: ResultadoSinafip): void {
    // Sin BOM ni cabeceras: conserva los campos y CRLF de la referencia PowerBuilder.
    saveAs(new Blob([this.texto(resultado)], { type: 'text/plain;charset=utf-8' }), this.nombreArchivo('txt'));
  }

  async descargarExcel(resultado: ResultadoSinafip): Promise<void> {
    const libro = new Workbook();
    libro.creator = 'EPMAPA-T';
    const hoja = libro.addWorksheet('SINAFIP');
    // Todas las columnas se mantienen como texto: Excel no elimina ceros ni convierte identificaciones.
    resultado.bloques.forEach(bloque => bloque.filas.forEach(fila => hoja.addRow([...fila])));
    const maximo = Math.max(1, ...resultado.bloques.map(bloque => bloque.columnas.length));
    for (let i = 1; i <= maximo; i++) { hoja.getColumn(i).width = 20; hoja.getColumn(i).numFmt = '@'; }
    const datos = await libro.xlsx.writeBuffer();
    saveAs(new Blob([datos], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), this.nombreArchivo('xlsx'));
  }
}
