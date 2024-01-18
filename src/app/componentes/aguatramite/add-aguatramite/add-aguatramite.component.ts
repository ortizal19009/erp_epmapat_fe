import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Aguatramite } from 'src/app/modelos/aguatramite.model';
import { Categoria } from 'src/app/modelos/categoria.model';
import { TramiteNuevo } from 'src/app/modelos/tramite-nuevo';
import { AguatramiteService } from 'src/app/servicios/aguatramite.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { TramiteNuevoService } from 'src/app/servicios/tramite-nuevo.service';
import { TramitesAguaService } from 'src/app/servicios/tramites-agua.service';

@Component({
   selector: 'app-add-aguatramite',
   templateUrl: './add-aguatramite.component.html',
   styleUrls: ['./add-aguatramite.component.css'],
})

export class AddAguatramiteComponent implements OnInit {

   formAguatram1: FormGroup;
   f_clientes: FormGroup;
   f_facturas: FormGroup;
   v_aguatramite: any;
   v_facturas: any;
   v_especificatramite: any;
   v_factura: any;
   aguatramite: Aguatramite = new Aguatramite();
   tramitenuevo: TramiteNuevo = new TramiteNuevo();
   idtipotramite: number;
   slect_disabled: boolean = true;
   direccion: string = '';

   constructor(private router: Router, private aguatramiService: AguatramiteService, private facturasS: FacturaService,
      private fb: FormBuilder, private s_pdf: PdfService, private authService: AutorizaService,
      private traminuevoService: TramiteNuevoService, private tramiteaguaService: TramitesAguaService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/aguatramite');
      let coloresJSON = sessionStorage.getItem('/aguatramite');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      let date: Date = new Date();

      this.formAguatram1 = this.fb.group({
         estado: 1,
         sistema: 'Instalación de agua y alcantarillado',
         fechaterminacion: null,
         observacion: 'Instalacion Nueva-Agua Potable',
         idtipotramite: { idtipotramite: 1 },
         idcliente_clientes: ['', Validators.required],
         idfactura_facturas: null,
         presentacedula: this.tramitenuevo.presentacedula,
         presentaescritura: this.tramitenuevo.presentaescritura,
         medidorempresa: this.tramitenuevo.medidorempresa,
         referencia: '',
         direccion: ['', Validators.required],
         barrio: 'SN',
         departamento: 'SN',
         nrocasa: 'SN',
         agua: this.tramitenuevo.solicitaagua,
         alcantarillado: this.tramitenuevo.solicitaalcantarillado,
         usucrea: this.authService.idusuario,
         feccrea: date,
      });

      this.f_facturas = this.fb.group({
         buscarFactura: ['', Validators.required],
      });

      this.f_clientes = this.fb.group({
         buscarCliente: ['', Validators.required],
      });
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   get f() { return this.formAguatram1.controls; }

   onSubmit() {
      this.guardarAguatramite();
      this.tramiteaguaService.genHojaInspeccion(this.formAguatram1.value, 'Concesión de servicios');
   }

   retornarListaAguaTramites() { this.router.navigate(['/aguatramite']); }

   guardarAguatramite() {
      this.aguatramite.idcliente_clientes = this.formAguatram1.value.idcliente_clientes;
      this.aguatramite.estado = this.formAguatram1.value.estado;
      this.aguatramite.sistema = this.formAguatram1.value.sistema;
      this.aguatramite.comentario = '';
      this.aguatramite.fechaterminacion = this.formAguatram1.value.fechaterminacion;
      this.aguatramite.observacion = this.formAguatram1.value.observacion;
      this.aguatramite.idtipotramite_tipotramite = this.formAguatram1.value.idtipotramite;
      this.aguatramite.idfactura_facturas = this.formAguatram1.value.idfactura_facturas;
      this.aguatramite.usucrea = this.formAguatram1.value.usucrea;
      this.aguatramite.feccrea = this.formAguatram1.value.feccrea;
      this.aguatramiService.saveAguaTramite(this.aguatramite).subscribe({
         next: (datos: any) => {
            this.guardarTramiteNuevo(datos);
         },
         error: (e) => console.error(e),
      });
   }

   guardarTramiteNuevo(aguatramite: Aguatramite) {
      let categoria: Categoria = new Categoria();
      categoria.idcategoria = 1;
      this.tramitenuevo.idaguatramite_aguatramite = aguatramite;
      this.tramitenuevo.direccion = this.formAguatram1.value.direccion;
      this.tramitenuevo.nrocasa = this.formAguatram1.value.nrocasa;
      this.tramitenuevo.nrodepar = this.formAguatram1.value.departamento;
      this.tramitenuevo.barrio = this.formAguatram1.value.barrio;
      this.tramitenuevo.usucrea = this.formAguatram1.value.usucrea;
      this.tramitenuevo.referencia = this.formAguatram1.value.referencia;
      this.tramitenuevo.aprobadoagua = 0;
      this.tramitenuevo.aprobadoalcantarillado = 0;
      this.tramitenuevo.fechainspeccion = this.formAguatram1.value.feccrea;
      this.tramitenuevo.estado = 1;
      this.tramitenuevo.codmedidorvecino = 0;
      this.tramitenuevo.idcategoria_categorias = categoria;
      this.tramitenuevo.feccrea = this.formAguatram1.value.feccrea;
      this.traminuevoService.saveTramiteNuevo(this.tramitenuevo).subscribe({
         next: (datos) => {
            // console.log('saveTramiteNuevo Ok!');
            this.retornarListaAguaTramites();
         },
         error: (e) => console.error(e),
      });
   }

   setCliente(cliente: any) {
      // console.log(cliente);
      this.formAguatram1.patchValue({
         idcliente_clientes: cliente,
      });
   }

   setAguaValue(e: any) {
      let value = e.target.checked;
      this.tramitenuevo.solicitaagua = value ? 1 : 0;
   }

   setAlcantarilladoValue(e: any) {
      let value = e.target.checked;
      this.tramitenuevo.solicitaalcantarillado = value ? 1 : 0;
   }

   setMedidorEmpresaValue(e: any) {
      let value = e.target.checked;
      this.tramitenuevo.medidorempresa = value ? 1 : 0;
   }

   setCedulaValue(e: any) {
      let value = e.target.checked;
      this.tramitenuevo.presentacedula = value ? 1 : 0;
   }

   setEscriturasValue(e: any) {
      let value = e.target.checked;
      this.tramitenuevo.presentaescritura = value ? 1 : 0;
   }

}
