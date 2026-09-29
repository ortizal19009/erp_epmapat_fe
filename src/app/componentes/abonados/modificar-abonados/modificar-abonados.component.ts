import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, of, switchMap } from 'rxjs';
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
import Swal from 'sweetalert2';
import * as L from 'leaflet';

@Component({
  selector: 'app-modificar-abonados',
  templateUrl: './modificar-abonados.component.html',
  styleUrls: ['./modi-abonado.component.css'],
})
export class ModificarAbonadosComponent implements OnInit, AfterViewInit, OnDestroy {
  abonado: Abonados = new Abonados();
  abonadoForm: FormGroup;
  f_responsablePago: FormGroup;
  f_clientes: FormGroup;
  categoria: Categoria[] = [];
  ruta: Rutas[] = [];
  ubicacionm: Ubicacionm[] = [];
  tipopago: Tipopago[] = [];
  estadom: Estadom[] = [];
  v_idabonado: number;
  v_cliente: any;
  cliente: any;
  v_resppago: any;
  v_idresponsable: any;
  setCategoria: any;
  date: Date = new Date();
  fotoCasaPreview: string | null = null;
  fotoMedidorPreview: string | null = null;
  selectedFotoCasa: File | null = null;
  selectedFotoMedidor: File | null = null;
  geoError: string | null = null;
  formSubmitted = false;
  guardando = false;
  fotoCasaError = false;
  fotoMedidorError = false;
  map!: L.Map | undefined;
  marker!: L.Marker | undefined;
  defaultCoords: L.LatLngExpression = [0.8038125013453109, -77.72763063596486];
  @ViewChild('mapEditor', { static: false }) mapEditor?: ElementRef;

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
  ) { }

  ngOnInit(): void {
    let date: Date = new Date();
    this.abonadoForm = this.fb.group({
      idabonado: [''],
      nromedidor: ['', Validators.required],
      lecturainicial: ['', Validators.required],
      estado: ['', Validators.required],
      fechainstalacion: ['', Validators.required],
      marca: ['', Validators.required],
      secuencia: ['', Validators.required],
      direccionubicacion: ['', Validators.required],
      localizacion: [''],
      observacion: ['', Validators.required],
      departamento: ['', Validators.required],
      piso: ['', Validators.required],
      idresponsable: ['', Validators.required],
      idcategoria_categorias: ['', Validators.required],
      idruta_rutas: ['', Validators.required],
      idcliente_clientes: ['', Validators.required],
      idubicacionm_ubicacionm: ['', Validators.required],
      idtipopago_tipopago: ['', Validators.required],
      idestadom_estadom: ['', Validators.required],
      medidorprincipal: ['', Validators.required],
      usucrea: this.authService.idusuario,
      geolocalizacion: ['', this.geolocalizacionValidator],
      fotocasaPath: [''],
      fotomedidorPath: [''],
      adultomayor: '',
      municipio: '',
      swalcantarillado: '',
      swbasura: '',
      feccrea: date,
      usumodi: this.authService.idusuario,
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

  ngAfterViewInit(): void {
    setTimeout(() => this.renderMapFromForm(), 300);
  }

  get f() {
    return this.abonadoForm.controls;
  }

  esInvalido(controlName: string): boolean {
    const control = this.abonadoForm.get(controlName);
    return !!control && control.invalid && (control.touched || this.formSubmitted);
  }

  get camposInvalidos(): string[] {
    const etiquetas: Record<string, string> = {
      nromedidor: 'Nro. medidor',
      lecturainicial: 'Lectura inicial',
      estado: 'Estado',
      fechainstalacion: 'Fecha instalación',
      marca: 'Marca',
      secuencia: 'Secuencia',
      direccionubicacion: 'Dirección',
      observacion: 'Observaciones',
      departamento: 'Departamento',
      piso: 'Piso',
      idresponsable: 'Responsable de pagos',
      idcategoria_categorias: 'Categoría',
      idruta_rutas: 'Ruta',
      idcliente_clientes: 'Cliente',
      idubicacionm_ubicacionm: 'Ubicación del medidor',
      idtipopago_tipopago: 'Tipo pago',
      idestadom_estadom: 'Estado medidor',
      medidorprincipal: 'Medidor principal',
      geolocalizacion: 'Geolocalización',
    };

    return Object.keys(this.abonadoForm.controls)
      .filter((key) => this.abonadoForm.get(key)?.invalid)
      .map((key) => etiquetas[key] || key);
  }

  listarCategorias() {
    this.categoriaS.getListCategoria().subscribe(
      (datos:any) => {
      this.categoria = datos;
      },
      (error) => console.error(error)
    );
  }

  listarUbicacion() {
    this.ubicacionmS.getAll().subscribe(
      (datos) => {
        this.ubicacionm = datos;
      },
      (error) => console.error(error)
    );
  }

  listarTipoPago() {
    this.tipopagoS.getListTipopago().subscribe(
      (datos) => {
        this.tipopago = datos;
      },
      (error) => console.error(error)
    );
  }

  listarEstadom() {
    this.estadomS.getListEstadom().subscribe(
      (datos) => {
        this.estadom = datos;
      },
      (error) => console.error(error)
    );
  }

  listarRutas() {
    this.rutasS.getListaRutas().subscribe(
      (datos) => {
        this.ruta = datos;
      },
      (error) => console.error(error)
    );
  }

  retornar() {
    if (this.guardando) return;
    const idabonado = Number(this.abonado?.idabonado ?? this.v_idabonado);
    if (idabonado > 0) sessionStorage.setItem('idabonadoToFactura', String(idabonado));
    this.router.navigate(['detalles-abonado']);
  }

  onSubmit() {
    if (this.guardando) return;
    this.formSubmitted = true;
    if (this.abonadoForm.invalid) {
      this.abonadoForm.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: this.camposInvalidos.length
          ? `Revisa estos campos: ${this.camposInvalidos.join(', ')}.`
          : 'Revisa los campos obligatorios antes de guardar.',
      });
      return;
    }

    const payload = {
      ...this.abonadoForm.getRawValue(),
      idresponsable: this.v_idresponsable ?? this.cliente,
      idcliente_clientes: this.cliente,
      usumodi: this.authService.idusuario,
      fecmodi: new Date().toISOString().split('T')[0],
    };

    Swal.fire({
      title: '¿Guardar cambios?',
      html: `Cuenta: <strong>${payload.idabonado}</strong><br>
             Medidor: <strong>${payload.nromedidor}</strong>`,
      icon: 'question',
      input: 'textarea',
      inputLabel: 'Observación del cambio',
      inputPlaceholder: 'Describa brevemente qué se modificó...',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="bi bi-check-circle"></i> Guardar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      if (this.guardando) return;
      this.guardando = true;
      let datosGuardados = false;
      const fotos = { fotocasa: this.selectedFotoCasa, fotomedidor: this.selectedFotoMedidor };
      const observacion = result.value || 'Sin observación';
      this.abonadosS.updateAbonadoAuditoria(
        payload,
        this.authService.idusuario,
        observacion,
        'MODIFICACION'
      ).pipe(
        switchMap((abonadoActualizado) => {
          datosGuardados = true;
          if (!fotos.fotocasa && !fotos.fotomedidor) {
            return of(abonadoActualizado);
          }

          return this.abonadosS.uploadFotosAbonado(
            payload.idabonado,
            fotos,
            this.authService.idusuario,
            'Actualización de fotos de abonado',
            'MODIFICACION'
          );
        }),
        finalize(() => this.guardando = false)
      ).subscribe({
        next: (abonadoActualizado) => {
          this.abonado = abonadoActualizado;
          this.selectedFotoCasa = null;
          this.selectedFotoMedidor = null;
          this.abonadoForm.patchValue({
            fotocasaPath: abonadoActualizado.fotocasaPath ?? abonadoActualizado.fotocasa ?? '',
            fotomedidorPath: abonadoActualizado.fotomedidorPath ?? abonadoActualizado.fotomedidor ?? '',
          });
          this.refreshFotoPreviews(abonadoActualizado);
          Swal.fire({ toast: true, icon: 'success', title: 'Abonado modificado', position: 'top', showConfirmButton: false, timer: 2000 });
          this.guardando = false;
          this.retornar();
        },
        error: (err) => {
          console.error(err);
          const detalle = err?.error?.message || err?.error?.detail ||
            (err?.status === 413 ? 'Las imagenes superan el tamano permitido por el servidor.' :
              err?.status === 0 ? 'No se pudo conectar con el servidor.' : 'No se pudo completar la operacion.');
          Swal.fire({ icon: 'error', title: datosGuardados ? 'No se pudieron guardar las fotos' : 'Error al guardar',
            text: datosGuardados ? `Los datos del abonado se guardaron, pero la carga de fotos no se completo. ${detalle} Las imagenes seleccionadas se conservan para reintentar.` : detalle });
        },
      });
    });
  }

  obtenerAbonado() {
    let idabonado = sessionStorage.getItem('idabonadoToModi');
    this.abonadosS.getById(+idabonado!).subscribe((datos) => {
      this.abonado = datos;
      this.setCategoria = datos.idcategoria_categorias.descripcion;
      this.cliente = datos.idcliente_clientes;
      this.v_idresponsable = datos.idresponsable;
      this.v_idabonado = +idabonado!;
      this.abonadoForm.patchValue({
        idabonado: datos.idabonado,
        nromedidor: datos.nromedidor,
        lecturainicial: datos.lecturainicial,
        estado: datos.estado,
        fechainstalacion: this.normalizarFechaInput(datos.fechainstalacion),
        marca: datos.marca,
        secuencia: datos.secuencia,
        direccionubicacion: datos.direccionubicacion,
        localizacion: datos.localizacion,
        observacion: datos.observacion,
        departamento: datos.departamento,
        piso: datos.piso,
        idresponsable: datos.idresponsable?.nombre ?? '',
        idcategoria_categorias: datos.idcategoria_categorias,
        idruta_rutas: datos.idruta_rutas,
        idcliente_clientes: datos.idcliente_clientes?.nombre ?? '',
        idubicacionm_ubicacionm: datos.idubicacionm_ubicacionm,
        idtipopago_tipopago: datos.idtipopago_tipopago,
        idestadom_estadom: datos.idestadom_estadom,
        medidorprincipal: datos.medidorprincipal,
        geolocalizacion: datos.geolocalizacion || '',
        fotocasaPath: datos.fotocasaPath || datos.fotocasa || '',
        fotomedidorPath: datos.fotomedidorPath || datos.fotomedidor || '',
        municipio: datos.municipio,
        adultomayor: datos.adultomayor,
        swbasura: datos.swbasura,
        swalcantarillado: datos.swalcantarillado,
        usumodi: datos.usumodi,
        fecmodi: this.normalizarFechaInput(datos.fecmodi),
        usucrea: datos.usucrea,
        feccrea: this.normalizarFechaInput(datos.feccrea),
      });
      this.abonadoForm.markAsPristine();
      this.refreshFotoPreviews(datos);
      setTimeout(() => this.renderMapFromForm(), 100);
    });
  }

  cargarDatos() {
    this.v_idabonado = this.abonadoForm.value.idabonado;
    this.onSubmit()
  }

  compararCategorias(o1: Categoria, o2: Categoria): boolean {
    const id1 = o1 && 'idcategoria' in o1 ? o1.idcategoria : (o1 as any);
    const id2 = o2 && 'idcategoria' in o2 ? o2.idcategoria : (o2 as any);
    if (id1 == null && id2 == null) {
      return true;
    }
    if (id1 == null || id2 == null) return false;
    return String(id1) === String(id2);
  }

  compararRutas(o1: Rutas, o2: Rutas): boolean {
    const id1 = o1 && 'idruta' in o1 ? o1.idruta : (o1 as any);
    const id2 = o2 && 'idruta' in o2 ? o2.idruta : (o2 as any);
    if (id1 == null && id2 == null) {
      return true;
    }
    if (id1 == null || id2 == null) return false;
    return String(id1) === String(id2);
  }

  compararUbicacion(o1: Ubicacionm, o2: Ubicacionm): boolean {
    const id1 = o1 && 'idubicacionm' in o1 ? o1.idubicacionm : (o1 as any);
    const id2 = o2 && 'idubicacionm' in o2 ? o2.idubicacionm : (o2 as any);
    if (id1 == null && id2 == null) {
      return true;
    }
    if (id1 == null || id2 == null) return false;
    return String(id1) === String(id2);
  }

  compararTpPago(o1: Tipopago, o2: Tipopago): boolean {
    const id1 = o1 && 'idtipopago' in o1 ? o1.idtipopago : (o1 as any);
    const id2 = o2 && 'idtipopago' in o2 ? o2.idtipopago : (o2 as any);
    if (id1 == null && id2 == null) {
      return true;
    }
    if (id1 == null || id2 == null) return false;
    return String(id1) === String(id2);
  }

  compararEstadoM(o1: Estadom, o2: Estadom): boolean {
    const id1 = o1 && 'idestadom' in o1 ? o1.idestadom : (o1 as any);
    const id2 = o2 && 'idestadom' in o2 ? o2.idestadom : (o2 as any);
    if (id1 == null && id2 == null) {
      return true;
    }
    if (id1 == null || id2 == null) return false;
    return String(id1) === String(id2);
  }

  private normalizarFechaInput(valor: any): string {
    if (!valor) {
      return '';
    }
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return '';
    }
    return fecha.toISOString().split('T')[0];
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
    this.abonadoForm.patchValue({ idcliente_clientes: cliente?.nombre ?? '' });
    if (!this.v_idresponsable) {
      this.setResponsablePago(cliente);
    }
  }
  setResponsablePago(respPago: any) {
    this.v_idresponsable = respPago;
    this.abonadoForm.patchValue({ idresponsable: respPago?.nombre ?? '' });
  }

  onFotoCasaUploaded(ruta: string): void {
    this.abonadoForm.patchValue({ fotocasaPath: ruta });
    this.fotoCasaPreview = this.abonadosS.getFotoCasaUrl(this.v_idabonado);
  }

  onFotoMedidorUploaded(ruta: string): void {
    this.abonadoForm.patchValue({ fotomedidorPath: ruta });
    this.fotoMedidorPreview = this.abonadosS.getFotoMedidorUrl(this.v_idabonado);
  }

  onFotoCasaSelected(event: Event): void {
    this.seleccionarFoto(event, 'casa');
  }

  onFotoMedidorSelected(event: Event): void {
    this.seleccionarFoto(event, 'medidor');
  }

  private seleccionarFoto(event: Event, tipo: 'casa' | 'medidor'): void {
    if (this.guardando) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 20 * 1024 * 1024) {
      input.value = '';
      Swal.fire('Imagen no valida', 'Seleccione una imagen JPG, PNG o WEBP de hasta 20 MB.', 'warning');
      return;
    }
    if (tipo === 'casa') {
      this.liberarPreview(this.fotoCasaPreview);
      this.selectedFotoCasa = file;
      this.fotoCasaError = false;
      this.fotoCasaPreview = URL.createObjectURL(file);
    } else {
      this.liberarPreview(this.fotoMedidorPreview);
      this.selectedFotoMedidor = file;
      this.fotoMedidorError = false;
      this.fotoMedidorPreview = URL.createObjectURL(file);
    }
  }

  private liberarPreview(url: string | null): void {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
  }

  ngOnDestroy(): void {
    this.liberarPreview(this.fotoCasaPreview);
    this.liberarPreview(this.fotoMedidorPreview);
    this.map?.remove();
  }

  private refreshFotoPreviews(abonado: Abonados | null | undefined): void {
    this.liberarPreview(this.fotoCasaPreview);
    this.liberarPreview(this.fotoMedidorPreview);
    this.fotoCasaError = false;
    this.fotoMedidorError = false;
    this.fotoCasaPreview = this.getFotoCasaPersistedUrl(abonado);
    this.fotoMedidorPreview = this.getFotoMedidorPersistedUrl(abonado);
  }

  private getFotoCasaPersistedUrl(abonado?: Abonados | null): string | null {
    const actual = abonado ?? this.abonado;
    const idabonado = Number(actual?.idabonado ?? this.v_idabonado);
    const ruta = actual?.fotocasaPath ?? actual?.fotocasa ?? null;
    return idabonado > 0 && ruta ? this.abonadosS.getFotoCasaUrl(idabonado) : null;
  }

  private getFotoMedidorPersistedUrl(abonado?: Abonados | null): string | null {
    const actual = abonado ?? this.abonado;
    const idabonado = Number(actual?.idabonado ?? this.v_idabonado);
    const ruta = actual?.fotomedidorPath ?? actual?.fotomedidor ?? null;
    return idabonado > 0 && ruta ? this.abonadosS.getFotoMedidorUrl(idabonado) : null;
  }

  capturarGeolocalizacion(): void {
    this.geoError = null;

    if (!navigator.geolocation) {
      this.geoError = 'El navegador no permite obtener geolocalización.';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.abonadoForm.patchValue({
          geolocalizacion: JSON.stringify([lat, lng]),
        });
        this.setMarkerPosition([lat, lng], true);
      },
      () => {
        this.geoError = 'No se pudo obtener la ubicación actual.';
      }
    );
  }

  private renderMapFromForm(): void {
    const coords = this.parseGeolocalizacion(this.abonadoForm?.value?.geolocalizacion);
    const center = coords || this.defaultCoords;

    if (!this.map && this.mapEditor?.nativeElement) {
      this.map = L.map(this.mapEditor.nativeElement).setView(center, coords ? 18 : 15);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(this.map);

      this.map.on('click', (e: L.LeafletMouseEvent) => {
        const point: [number, number] = [e.latlng.lat, e.latlng.lng];
        this.updateGeolocalizacion(point);
        this.setMarkerPosition(point, false);
      });
    }

    if (!this.map) return;

    this.setMarkerPosition(center, false);
    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  private setMarkerPosition(coords: L.LatLngExpression, shouldCenter: boolean): void {
    if (!this.map) return;

    if (!this.marker) {
      this.marker = L.marker(coords, { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const latlng = this.marker?.getLatLng();
        if (!latlng) return;
        this.updateGeolocalizacion([latlng.lat, latlng.lng]);
      });
    } else {
      this.marker.setLatLng(coords);
    }

    if (shouldCenter) {
      this.map.setView(coords, 18);
    }
  }

  private updateGeolocalizacion(coords: [number, number]): void {
    this.abonadoForm.patchValue({
      geolocalizacion: JSON.stringify(coords),
    });
    this.abonadoForm.get('geolocalizacion')?.markAsTouched();
  }

  private geolocalizacionValidator(control: AbstractControl): ValidationErrors | null {
    const value = `${control.value ?? ''}`.trim();
    if (!value) {
      return null;
    }

    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed) || parsed.length < 2) {
        return { geolocalizacionFormato: true };
      }

      const lat = Number(parsed[0]);
      const lng = Number(parsed[1]);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return { geolocalizacionFormato: true };
      }

      return null;
    } catch {
      return { geolocalizacionFormato: true };
    }
  }

  private parseGeolocalizacion(value: string | null | undefined): [number, number] | null {
    if (!value) return null;

    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        const lat = Number(parsed[0]);
        const lng = Number(parsed[1]);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          return [lat, lng];
        }
      }
    } catch {
      return null;
    }

    return null;
  }
}
