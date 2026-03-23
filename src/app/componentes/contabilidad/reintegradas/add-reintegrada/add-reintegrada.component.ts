import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { Certipresu } from 'src/app/modelos/contabilidad/certipresu.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';

@Component({
  selector: 'app-add-reintegrada',
  templateUrl: './add-reintegrada.component.html',
  styleUrls: ['./add-reintegrada.component.css']
})
export class AddReintegradaComponent implements OnInit {

  formReintegrada: FormGroup;
  documentos: Documentos[] = [];
  responsables: Beneficiarios[] = [];
  idbeneres: number | null;
  inicioFormulario: number = 0;
  tiempoTranscurrido: number = 0;

  constructor(private fb: FormBuilder, private beneService: BeneficiariosService, private router: Router, public authService: AutorizaService,
    private docuService: DocumentosService, private reinteService: CertipresuService) { }

  ngOnInit(): void {

    if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
    sessionStorage.setItem('ventana', '/reintegradas');
    let coloresJSON = sessionStorage.getItem('/reintegradas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    this.formReintegrada = this.fb.group({
      numero: ['', [Validators.required, Validators.min(1)], this.valNumero()],
      fecha: ['', Validators.required, this.valAño()],
      intdoc: this.documentos,
      numdoc: ['', Validators.required],
      idbeneres: ['', Validators.required, this.valResponsa()],
      descripcion: [],
    }, { updateOn: "blur" });

    this.inicioFormulario = Date.now();
    this.listarDocumentos();
    this.ultima();
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1')
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  listarDocumentos() {
    this.docuService.getListaDocumentos().subscribe({
      next: (documentos: Documentos[]) => {
        this.documentos = documentos;
        this.f['intdoc'].setValue(1)
      },
      error: (err) => console.error(err.error)
    });
  }

  get f() { return this.formReintegrada.controls; }

  ultima() {
    this.reinteService.ultima(2).subscribe({
      next: (resp: Certipresu) => {
        let x = resp.numero + 1;
        this.formReintegrada.patchValue({ numero: x, fecha: resp.fecha });
      },
      error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el Ultimo', err.error) }
    });
  }

  responsaxNombre(e: any) {
    if (e.target.value != '') {
      this.beneService.findByNomben(e.target.value).subscribe({
        next: (responsables: Beneficiarios[]) => this.responsables = responsables,
        error: err => console.error(err.error),
      });
    }
  }
  onResponsableSelected(e: any) {
    const selectedOption = this.responsables.find((x: { nomben: any; }) => x.nomben === e.target.value);
    if (selectedOption) this.idbeneres = selectedOption.idbene;
    else this.idbeneres = null;
  }

  onSubmit() {
    // Vuelve a validar el número (Mientras toman café ...)
    this.validaNumeroAntesDeGuardar().subscribe(esValido => {
      if (!esValido) {
        const fin = Date.now();
        this.tiempoTranscurrido = fin - this.inicioFormulario;
        this.authService.mensaje404(`El Reintegro de Certificación ${this.formReintegrada.value.numero} ya fue creado por otro Usuario. 
               Tiempo transcurrido: ${this.authService.formatearTiempo(this.tiempoTranscurrido)}`);
        return;
      }
      // Guarda
      const dto: ReintegradaCreateDTO = {
        tipo: 2,
        valor: 0,
        numero: this.formReintegrada.value.numero,
        fecha: this.formReintegrada.value.fecha,
        intdoc: { intdoc: this.formReintegrada.value.intdoc },
        numdoc: this.formReintegrada.value.numdoc,
        idbene: { idbene: 1 },
        idbeneres: { idbene: this.idbeneres },
        descripcion: this.formReintegrada.value.descripcion,
        usucrea: this.authService.idusuario,
        feccrea: new Date(),
      };
      this.reinteService.saveCertipresu(dto).subscribe({
        next: (reintegrada: Certipresu) => {
          this.authService.swal('success', `Reintegro de Certificación ${reintegrada.numero} guardada con éxito`);
          sessionStorage.setItem('ultreintegrada', reintegrada.idcerti.toString());
          //Actualiza los datos de búsqueda para que se muestre en la lista de certificaciones
          let buscaDesdeNum = this.f['numero'].value - 16;
          if (buscaDesdeNum <= 0) buscaDesdeNum = 1;
          let year = new Date(this.f['fecha'].value).getFullYear(); // Extraer el año de la fecha 
          const buscaReintegradas = {
            desdeNum: buscaDesdeNum,
            hastaNum: this.f['numero'].value,
            desdeFecha: year.toString() + "-01-01",
            hastaFecha: year.toString() + "-12-31",
          };
          sessionStorage.setItem("buscaReintegradas", JSON.stringify(buscaReintegradas));
          //Datos a enviar a partixcerti
          const datosToPartixreinte = {
            idcerti: reintegrada.idcerti,
            desdeNum: buscaDesdeNum,
            hastaNum: this.f['numero'].value
          };
          sessionStorage.setItem('datosToPartixreinte', JSON.stringify(datosToPartixreinte));
          this.router.navigate(['partixreinte']);
        },
        error: err => { console.error('Al guardar: ', err.error); this.authService.mostrarError('Error al guardar', err.error) }
      });
    });
  }

  regresar() { this.router.navigate(['/reintegradas']); }

  // Valida el número
  valNumero(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const valor = control.value;
      if (valor === null || valor === undefined || valor === '') { return of(null); }
      return this.reinteService.valNumero(valor, 2).pipe(
        map(existe => (existe ? { existe: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  // Al guardar Valida el número nuevamente
  validaNumeroAntesDeGuardar(): Observable<boolean> {
    const valor = this.formReintegrada.get('numero')?.value;
    if (valor === null || valor === undefined || valor === '') { return of(true); }
    return this.reinteService.valNumero(valor, 2).pipe(
      map(existe => !existe),
      catchError(() => of(true))
    );
  }

  //Valida el año de la fecha
  valAño(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const datos = this.authService.getDatosEmpresa();
      const añoEmpresa = datos?.fechap?.toString().slice(0, 4);
      const añoDigitado = control.value?.toString().slice(0, 4);
      const esValido = añoEmpresa === añoDigitado;
      return of(esValido ? null : { añoinvalido: true });
    };
  }

  //Valida que se haya seleccionado un Responsable
  valResponsa(): AsyncValidatorFn {
    return (_control: AbstractControl) => {
      if (this.idbeneres == null) { return of({ invalido: true }); }
      return of(null);
    };
  }

}

export interface ReintegradaCreateDTO {

  tipo: number;
  numero: number;
  fecha: Date;
  valor: number;
  intdoc: { intdoc: number };
  numdoc: String;
  idbene: { idbene: number };
  idbeneres: { idbene: number | null };
  descripcion: String;
  usucrea: number;
  feccrea: Date;
}