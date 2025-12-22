import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Certificaciones } from 'src/app/modelos/ccertificaciones';
import { Facturas } from 'src/app/modelos/facturas.model';
import { TpCertifica } from 'src/app/modelos/tp-certifica';
import { CertificacionesService } from 'src/app/servicios/ccertificaciones.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { TpCertificaService } from 'src/app/servicios/tp-certifica.service';

@Component({
  selector: 'app-modificar-certificaciones',
  templateUrl: './modificar-certificaciones.component.html'
})

export class ModificarCertificacionesComponent implements OnInit {

  certificaciones: Certificaciones = new Certificaciones();
  certificacionesForm: FormGroup; f_facturas: FormGroup;
  tpcertifica: any; facturas: any;
    v_factura: any;

  constructor(private fb: FormBuilder, private router: Router, private tpcertificaS: TpCertificaService,
    private certificacionesS: CertificacionesService, private facService: FacturaService, private authService: AutorizaService
  ) { }

  ngOnInit(): void {
    let date: Date= new Date ();
    this.certificacionesForm = this.fb.group({
      idcertificacion: [''],
      numero: ['', Validators.required],
      anio: ['', Validators.required],
      referenciadocumento: ['', Validators.required],
      idtpcertifica_tpcertifica: ['', Validators.required],
      idfactura_facturas: this.v_factura,
      usumodi: this.authService.idusuario,
      fecmodi: date,
      usucrea:this.authService.idusuario,
      feccrea: date,
    });
    this.f_facturas = this.fb.group({
      buscarFactura: ['', Validators.required]
    });
    this.listarTpCerifica();
    this.modificarCertificaciones();
  }

  onSubmit() {
    this.guardarCertificacion();
  }

  listarTpCerifica() {
    this.tpcertificaS.getListaTpCertifica().subscribe(datos => {
      this.tpcertifica = datos;
    }, error => console.error(error))
  }

  retornarListarCertificaiones() {
    this.router.navigate(['/ccertificaciones']);
  }

  guardarCertificacion() {
    this.certificacionesForm.value.idfactura_facturas = this.v_factura;
    this.certificacionesS.saveCertificaciones(this.certificacionesForm.value).subscribe(datos => {
      this.retornarListarCertificaiones();
      this.mensajeSuccess(this.certificacionesForm.value.numero);
    }, error => console.error(error))
  }

  modificarCertificaciones() {
    let idcertificacion = localStorage.getItem("idcertificacion");
    this.certificacionesS.getListaById(+idcertificacion!).subscribe(datos => {
      this.v_factura = datos.idfactura_facturas;
      this.certificacionesForm.setValue({
        idcertificacion: datos.idcertificacion,
        numero: datos.numero,
        anio: datos.anio,
        referenciadocumento: datos.referenciadocumento,
        idtpcertifica_tpcertifica: datos.idtpcertifica_tpcertifica,
        idfactura_facturas:datos.idfactura_facturas.nrofactura,
        usumodi: datos.usumodi,
        fecmodi: datos.fecmodi,
        usucrea:datos.usucrea,
        feccrea: datos.feccrea,

      })
    });
  }

  mensajeSuccess(n:String){
    localStorage.setItem("mensajeSuccess","Certificación <strong>"+n+"</strong> actualizada ");
  }

  compararTpCertifica(o1:TpCertifica , o2:TpCertifica):boolean{
    if(o1 === undefined && o2 === undefined){return true;}
    else{
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined ? false: o1.idtpcertifica == o2.idtpcertifica;
    }
  }

  compararFacturas(o1:Facturas , o2:Facturas):boolean{
    if(o1 === undefined && o2 === undefined){return true;}
    else{
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined ? false: o1.idfactura == o2.idfactura;
    }
  }

  buscarFacturas(){
    let i_factura = document.getElementById("buscarFactura") as HTMLInputElement;
    let inFacturas = document.getElementById("idi-facturas") as HTMLElement;
    let p_message = document.createElement("span");
    p_message.style.color = "red";
    inFacturas.appendChild(p_message);
    i_factura.addEventListener('keyup', ()=>{
      if (i_factura.value === ''){
        i_factura.style.border = "#F54500 1px solid";
        p_message.innerHTML = "<strong>Error!.</strong>  El campo de texto no puede estar vacio</br>";
      }else{
        i_factura.style.border = "";
        p_message.remove();

      }
    });
    if (i_factura.value === ''){
      i_factura.style.border = "#F54500 1px solid";
      p_message.innerHTML = "<strong>Error!.</strong>  El campo de texto no puede estar vacio</br>";
      this.facturas = [];
    }else if(i_factura.value != ''){
      i_factura.style.border = "";
      this.facService.getListaByNroFactura(this.f_facturas.value.buscarFactura).subscribe(datos => {
        this.facturas = datos;
      });
      p_message.remove();
    }
  }

  obtenerValorFactura(factura: Facturas){
    let idfactura_facturas = document.getElementById("idfactura_facturas") as HTMLInputElement;
    idfactura_facturas.value = factura.nrofactura.toString();
    this.v_factura = factura;
  }

}
