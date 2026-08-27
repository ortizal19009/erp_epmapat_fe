import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Condmultaintereses } from 'src/app/modelos/condmultasintereses';
import { CondmultasinteresesService } from 'src/app/servicios/condmultasintereses.service';
import { LoadingService } from 'src/app/servicios/loading.service';

@Component({
  selector: 'app-condonaciones-pendientes',
  templateUrl: './condonaciones-pendientes.component.html',
  styleUrls: ['./condonaciones-pendientes.component.css'],
})
export class CondonacionesPendientesComponent implements OnInit {
  filtroForm!: FormGroup;
  solicitudes: Condmultaintereses[] = [];
  solicitudSeleccionada: Condmultaintereses | null = null;
  filtro = '';
  puedeAprobar = false;

  constructor(
    private fb: FormBuilder,
    private coloresService: ColoresService,
    private condonacionesService: CondmultasinteresesService,
    private authService: AutorizaService,
    private loadingService: LoadingService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const coloresJSON = sessionStorage.getItem('/condonaciones');
    if (coloresJSON) {
      const colores = JSON.parse(coloresJSON);
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    }
    this.filtroForm = this.fb.group({
      estado: ['PENDIENTE'],
      cuenta: [''],
      nrofactura: [''],
      usucrea: [''],
      feccreaDesde: [''],
      feccreaHasta: [''],
    });

    await this.validarPermisoAprobacion();
    if (this.puedeAprobar) {
      this.buscar();
    }
  }

  async buscaColor() {
    try {
      await this.coloresService.setcolor(1, 'condonaciones');
    } catch {}
  }

  private async validarPermisoAprobacion(): Promise<void> {
    if (this.authService.idusuario == 1) {
      this.puedeAprobar = true;
      return;
    }

    try {
      const permission = await this.coloresService.getRolePermission(
        this.authService.idusuario,
        'condonaciones-pendientes'
      );
      this.puedeAprobar = permission >= 3;
    } catch {
      this.puedeAprobar = false;
    }

    if (!this.puedeAprobar) {
      this.authService.swal('warning', 'No tiene permiso para aprobar exoneraciones.');
      this.router.navigate(['/condonaciones']);
    }
  }

  buscar() {
    if (!this.puedeAprobar) {
      return;
    }
    this.loadingService.showLoading();
    this.condonacionesService.listar(this.filtroForm.value).subscribe({
      next: (data) => {
        this.solicitudes = data || [];
        if (this.solicitudes.length > 0) {
          this.seleccionar(this.solicitudes[0]);
        } else {
          this.solicitudSeleccionada = null;
        }
        this.loadingService.hideLoading();
      },
      error: (e) => {
        console.error(e);
        this.loadingService.hideLoading();
        this.authService.swal('error', 'No se pudieron cargar las solicitudes.');
      },
    });
  }

  seleccionar(item: Condmultaintereses) {
    this.solicitudSeleccionada = item;
    if (!item?.idcondmultainteres) {
      return;
    }
    this.condonacionesService.getById(item.idcondmultainteres).subscribe({
      next: (detalle) => (this.solicitudSeleccionada = detalle),
      error: (e) => console.error(e),
    });
  }

  async aprobar() {
    if (!this.puedeAprobar || !this.solicitudSeleccionada?.idcondmultainteres) {
      return;
    }
    const confirmado = await Swal.fire({
      title: 'Aprobar exoneración',
      text: 'Está a punto de aprobar definitivamente esta exoneración. Una vez aprobada, las facturas seleccionadas quedarán configuradas para no cobrar los intereses y/o multas correspondientes en Recaudación.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirmado.isConfirmed) {
      return;
    }
    this.loadingService.showLoading();
    this.condonacionesService
      .aprobar(this.solicitudSeleccionada.idcondmultainteres, this.authService.idusuario)
      .subscribe({
        next: () => {
          this.loadingService.hideLoading();
          this.authService.swal('success', 'Solicitud aprobada correctamente.');
          this.buscar();
        },
        error: (e) => {
          this.loadingService.hideLoading();
          console.error(e);
          this.authService.swal('error', e?.error?.message || 'No se pudo aprobar la solicitud.');
        },
      });
  }

  async rechazar() {
    if (!this.puedeAprobar || !this.solicitudSeleccionada?.idcondmultainteres) {
      return;
    }
    const resultado = await Swal.fire({
      title: 'Rechazar solicitud',
      input: 'textarea',
      inputLabel: 'Motivo de rechazo',
      inputPlaceholder: 'Detalle la razón del rechazo',
      inputValidator: (value) => (!value ? 'Debe ingresar una observación.' : null),
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
    });
    if (!resultado.isConfirmed) {
      return;
    }
    this.loadingService.showLoading();
    this.condonacionesService
      .rechazar(this.solicitudSeleccionada.idcondmultainteres, this.authService.idusuario, resultado.value)
      .subscribe({
        next: () => {
          this.loadingService.hideLoading();
          this.authService.swal('success', 'Solicitud rechazada correctamente.');
          this.buscar();
        },
        error: (e) => {
          this.loadingService.hideLoading();
          console.error(e);
          this.authService.swal('error', e?.error?.message || 'No se pudo rechazar la solicitud.');
        },
      });
  }
}
