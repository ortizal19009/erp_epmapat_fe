import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Clientes } from 'src/app/modelos/clientes';
import { Facturas } from 'src/app/modelos/facturas.model';
import { TpCertifica } from 'src/app/modelos/tp-certifica';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { CertificacionesService } from 'src/app/servicios/certificaciones.service';
import { DocCertificacionesService } from 'src/app/servicios/doc-certificaciones.service';
import { FacturaService } from 'src/app/servicios/factura.service';

@Component({
   selector: 'app-gene-certificacion',
   templateUrl: './gene-certificacion.component.html',
   styleUrls: ['./gene-certificacion.component.css']
})

export class GeneCertificacionComponent implements OnInit {

   certificaciones: any;
   sufijos: any = [{ sufijo: 'Abogado' }, { sufijo: 'MSC.' }];
   fecha: Date = new Date();
   formGenera: FormGroup;
   respuesta: String = '';

   certificacion: any;
   factura: Facturas = new Facturas();
   cliente: Clientes = new Clientes();
   _abonados: any;
   tipcertificacion: TpCertifica = new TpCertifica();
   validador: boolean = false;
   estarDia: boolean = false;
   serAbonado: boolean = false;
   adeudar: boolean = false;
   _deudas: any;

   constructor(public certiService: CertificacionesService, public router: Router, private acRouter: ActivatedRoute,
      private fb: FormBuilder, private docCertiService: DocCertificacionesService, private facService: FacturaService,
      private aboService: AbonadosService) { }

   ngOnInit(): void {
      let idcertificacion = this.acRouter.snapshot.paramMap.get('idcertificacion');
      sessionStorage.setItem('ventana', '/certificaciones');
      let coloresJSON = sessionStorage.getItem('/certificaciones');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formGenera = this.fb.group({
         nroCertificacion: '',
         sufijo: 'Abogado',
         nombre: '',
         cargo: '',
         tpCertificado: '',
         // fechaSolicitud: this.date,
         // fechaSolicitud: new Date(this.date),
         // fechaSolicitud: new Date(this.date.toJSON()),
         // fechaSolicitud: new Date(this.fecha.toJSON()),
         fechaSolicitud: new Date(this.fecha.toJSON().substring(0, 10)),
         sino: '0',
         cliente: this.fb.group({
            cNombre: 'NOMBRE DEL CLIENTE',
            cIdentificacion: '000999999999',
            direccion: 'DIRECCION CLIENTE',
            cuenta: 'NUMERO DE CUENTA',
         }),
      });
      this.getCertificacionById(+idcertificacion!);
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   getCertificacionById(idcertificacion: any) {
      this.certiService.getListaById(idcertificacion).subscribe({
         next: (datos: any) => {
            // console.log(datos);
            if (datos.idcliente_clientes != null) {
               this.certificacion = datos;
               this.factura = datos.idfactura_facturas;
               this.cliente = datos.idcliente_clientes;
               this.tipcertificacion = datos.idtpcertifica_tpcertifica;

               this.formGenera.patchValue({
                  tpCertificado: datos.idtpcertifica_tpcertifica.idtpcertifica,
                  cliente: {
                     cNombre: datos.idcliente_clientes.nombre,
                     cIdentificacion: datos.idcliente_clientes.cedula,
                     direccion: datos.idcliente_clientes.direccion,
                  },
               });
            }
         },
         error: (e) => console.error(e),
      });
   }

   verificar() {
      switch (this.formGenera.value.tpCertificado) {
         case 1:
            this.buscarDeudas(this.certificacion.idcliente_clientes.idcliente);
            this.respuesta = 'SI adeuda'
            break;
         case 2:
            //this.buscarDeudasConsumo(this.formGenera.value.cliente)
            this.estarDia = true;
            this.findAboByCliente(this.certificacion.idcliente_clientes);
            // console.log(this.formGenera.value);
            this.respuesta = 'NO está al día'
            break;
         case 6:
            this.serAbonado = true;
            this.findAboByCliente(this.certificacion.idcliente_clientes);
            this.respuesta = 'NO es Abonado'
            break;
      }
   }

   generarCertificado() {
      this.formGenera.value.nroCertificacion = this.certificacion.numero;
      switch (this.formGenera.value.tpCertificado) {
         case 1:
            this.docCertiService.certificaadoNoAdeudar(this.formGenera.value);
            break;
         case 2:
            this.docCertiService.certificadoEstarAlDia(this.formGenera.value);
            break;
         case 6:
            this.docCertiService.certificadoServAbonado(this.formGenera.value);
            break;
      }
   }

   regresar() { this.router.navigate(['certificaciones']); }

   findAboByCliente(cliente: Clientes) {
      if (cliente != null) {
         this.aboService.getByIdCliente(cliente.idcliente).subscribe({
            next: (datos) => {
               this._abonados = datos;
            },
            error: (e) => console.error(e),
         });
      }
   }

   setAbonado(e: any) {
      if (e.target.checked === true) {
         console.log(e.target.value);
         console.log(this.formGenera.value.tpCertificado);
         this.formGenera.patchValue({
            sino: '1',
            cliente: { cuenta: e.target.value },
         });
         if (this.formGenera.value.tpCertificado === 2) {
            this.buscarDeudasConsumo(+e.target.value!);
         }
      }
   }

   buscarDeudasConsumo(idabonado: any) {
      this.facService.getDeudaConsumo(idabonado).subscribe({
         next: (datos: any) => {
            if (datos.length === 0) {
               this.formGenera.patchValue({
                  sino: '1',
               });
            } else {
               this.formGenera.patchValue({
                  sino: '0',
               });
            }
            console.log(datos);
         },
         error: (e) => console.error(e),
      });
   }

   buscarDeudas(idcliente: any) {
      this.facService.getSinCobro(idcliente).subscribe({
         next: (datos) => {
            console.log(datos);
            if (datos.length != 0) {
               this.formGenera.patchValue({
                  sino: '1',
               });
               this.adeudar = true;
               this._deudas = datos;
            }
         },
         error: (e) => console.error(e),
      });
   }

}
