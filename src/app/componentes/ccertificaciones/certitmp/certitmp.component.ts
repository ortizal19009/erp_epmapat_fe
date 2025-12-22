import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Certificaciones } from 'src/app/modelos/ccertificaciones';
import { CertificacionesService } from 'src/app/servicios/ccertificaciones.service';
import { DocCertificacionesService } from 'src/app/servicios/doc-certificaciones.service';

@Component({
   selector: 'app-certitmp',
   templateUrl: './certitmp.component.html',
   styleUrls: ['./certitmp.component.css']
})
export class CertitmpComponent implements OnInit {

   certificaciones: any;
   sufijos: any = [{ sufijo: 'Abogado' }, { sufijo: 'MSC.' }];
   date: Date = new Date();
   f_genCertificado: FormGroup;

   constructor(
      public certificacionesS: CertificacionesService,
      public router: Router,
      private fb: FormBuilder,
      private s_genCertificado: DocCertificacionesService
   ) { }

   ngOnInit(): void {
      this.f_genCertificado = this.fb.group({
         sufijo: 'Abogado',
         nombre: '',
         cargo: '',
         tpCertificado: 'option1',
         fechaSolicitud: '',
         sino: '1',
         cliente: this.fb.group({
            cNombre: 'NOMBRE DEL CLIENTE',
            cIdentificacion: '000999999999',
            direccion: 'DIRECCION CLIENTE',
            cuenta: 'NUMERO DE CUENTA',
         }),
      });
      //this.f_genCertificado.patchValue({ fechaSolicitud: this.date });
      this.listarCertificaciones();
   }

   public listarCertificaciones() {
      this.certificacionesS.getListaCertificaciones().subscribe(
         (datos) => {
            this.certificaciones = datos;
         },
         (error) => console.error(error)
      );
   }

   modificarCertificaciones(certificaciones: Certificaciones) {
      localStorage.setItem(
         'idcertificacion',
         certificaciones.idcertificacion.toString()
      );
      this.router.navigate(['modificar-certificaciones']);
   }

   eliminarCertificaciones(idcertificacion: number) {
      localStorage.setItem('idcertificacionToDelete', idcertificacion.toString());
   }

   aprobarEliminacionCertificacion() {
      let idc = localStorage.getItem('idcertificacionToDelete');
      this.certificacionesS.deleteCertificaciones(+idc!).subscribe(
         (datos) => {
            localStorage.setItem('mensajeSuccess', 'Certificacion eliminada');
            this.listarCertificaciones();
         },
         (error) => console.error(error)
      );
      localStorage.removeItem('idcertificacionToDelete');
   }

   verDocumentos(ruta: any) {
      location.href = `${ruta}`;
   }

   generarCertificado() {
      switch (this.f_genCertificado.value.tpCertificado) {
         case 'option1':
            this.s_genCertificado.certificadoEstarAlDia(
               this.f_genCertificado.value
            );
            break;
         case 'option2':
            this.s_genCertificado.certificaadoNoAdeudar(
               this.f_genCertificado.value
            );
            break;
         case 'option3':
            this.s_genCertificado.certificadoServAbonado(
               this.f_genCertificado.value
            );
            break;
      }
   }

}
