import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { ColoresService } from '@compartida/colores.service';
import { Eliminadosapp } from '@modelos/administracion/eliminadosapp.model';
import { Repoxopcion } from '@modelos/administracion/repoxopcion.model';
import { EliminadosappService } from '@servicios/administracion/eliminadosapp.service';
import { ReportesjrService } from '@servicios/administracion/reportesjr.service';
import { RepoxopcionService } from '@servicios/administracion/repoxopcion.service';
import { map } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-repoxopcion',
  templateUrl: './repoxopcion.component.html',
  styleUrls: ['./repoxopcion.component.css']
})
export class RepoxopcionComponent implements OnInit {
   formBuscar!: FormGroup;
   swbuscando?: boolean;
   txtbuscar: string = 'Buscar';
   buscarRepoxopcion = { codigo: String, opcion: String, nombre: String }
   repoxopcion: Repoxopcion[] = [];
   ultIdSelec!: number;
   repoxFiltrados: Repoxopcion[] = [];
   ordenColumna: keyof RepoxVisual = 'codigo';
   ordenAscendente: boolean = true;
   formRepoxopcion!: FormGroup;
   swnuevo: boolean = false;
   swmodifi: boolean = false;
   idrepoxopcion!: number;
   antcodigo!: string;
   antopcion!: string;
   antnombre!: string;

   constructor(public fb: FormBuilder, private router: Router, public authService: AutorizaService, private coloresService: ColoresService,
      private repoxService: RepoxopcionService, private repojrService: ReportesjrService, private elimService: EliminadosappService ) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/repoxopcion');
      let coloresJSON = sessionStorage.getItem('/repoxopcion');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      //Campos guardados o ''
      let swbuscar: boolean;
      let codigo: string; let opcion: string;; let nombre: string;
      const buscarRepoxopcionJSON = sessionStorage.getItem('buscarRepoxopcion');
      if (buscarRepoxopcionJSON) {
         swbuscar = true;
         const buscarRepoxopcion = JSON.parse(buscarRepoxopcionJSON);
         codigo = buscarRepoxopcion.codigo;
         opcion = buscarRepoxopcion.opcion;
         nombre = buscarRepoxopcion.nombre;
      } else {
         swbuscar = false;
         codigo = '';
         opcion = '';
         nombre = '';
      }

      this.formBuscar = this.fb.group({
         codigo: codigo,
         opcion: opcion,
         nombre: nombre,
         filtroControl: '',
      });

      this.formBuscar.get('filtroControl')?.valueChanges.subscribe((valor: any) => { this.filtrar(valor) });
      if (swbuscar) this.buscar();
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario!, 'repoxopcion');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/repoxopcion', coloresJSON);
         this.colocaColor(datos);
      } catch (error) {
         console.error(error);
      }
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   public buscar() {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando';
      this.formBuscar.get('filtroControl')?.setValue('');
      this.ultIdSelec = 0;

      const codigo = this.formBuscar.get('codigo')?.value || '';
      const opcion = this.formBuscar.get('opcion')?.value || '';
      const nombre = this.formBuscar.get('nombre')?.value || '';
      this.repoxService.buscaRepoxopcion(codigo, opcion, nombre).subscribe({
         next: (repoxopcion: Repoxopcion[]) => {
            this.repoxopcion = repoxopcion;
            this.repoxFiltrados = [...repoxopcion];
            //Guarda los campos de búsqueda
            this.buscarRepoxopcion = {
               codigo: this.formBuscar.value.codigo,
               opcion: this.formBuscar.value.opcion,
               nombre: this.formBuscar.value.nombre,
            };
            // Verifica si hay al menos un campo con valor para guardar en session
            const camposBusca = Object.values(this.buscarRepoxopcion)
               .some(valor => valor !== null && valor !== undefined && valor.toString().trim() !== '');
            if (camposBusca) sessionStorage.setItem('buscarRepoxopcion', JSON.stringify(this.buscarRepoxopcion));
            else sessionStorage.removeItem('buscarRepoxopcion');
            this.swbuscando = false;
            this.txtbuscar = 'Buscar';
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar', err.error) }
      });
   }

   ordenarPor(campo: keyof RepoxVisual): void {
      if (this.ordenColumna === campo) {
         this.ordenAscendente = !this.ordenAscendente;
      } else {
         this.ordenColumna = campo;
         this.ordenAscendente = true;
      }

      this.repoxFiltrados.sort((a, b) => {
         const valorA = a[campo];
         const valorB = b[campo];

         if (valorA == null && valorB == null) return 0;
         if (valorA == null) return 1;
         if (valorB == null) return -1;

         const esNumero = typeof valorA === 'number' && typeof valorB === 'number';

         return esNumero
            ? (this.ordenAscendente ? valorA - valorB : valorB - valorA)
            : this.ordenAscendente
               ? String(valorA).localeCompare(String(valorB))
               : String(valorB).localeCompare(String(valorA));
      });
   }

   filtrar(valor: any): void {
      const filtro = valor.toLowerCase();
      if (!filtro) {
         if (this.repoxFiltrados.length > 0) this.repoxFiltrados = [...this.repoxopcion];
         return;
      }
      this.repoxFiltrados = this.repoxopcion.filter(a => {
         return [a.codigo, a.opcion, a.nombre].some(campo =>
            String(campo).toLowerCase().includes(filtro)
         );
      });
   }

   onCellClick(event: any, repoxopcion: any) {
      const tagName = event.target.tagName;
      this.ultIdSelec = repoxopcion.idrepoxopcion;
      if (tagName === 'TD') {
         sessionStorage.setItem('idrepoxopcionToInfo', repoxopcion);
         this.router.navigate(['/repoxopcion']);
      }
   }

   toggleNuevo() {
      if (this.swmodifi) this.swmodifi = !this.swmodifi;
      this.swnuevo = !this.swnuevo;
      this.creaForm();
   }

   creaForm() {
      this.formRepoxopcion = this.fb.group({
         codigo: [null, [Validators.required, Validators.minLength(5), Validators.maxLength(7)],
            this.valCodigo.bind(this), Validators.pattern(/^[0-9]{5,6}$/)],
         opcion: [null, [Validators.required, Validators.minLength(3)]],
         nombre: [null, [Validators.required, Validators.minLength(3)], this.valNombre.bind(this)]
      },
         { updateOn: "blur" }
      );
   }

   get f() { return this.formRepoxopcion.controls; }

   guardar() {
      let newrepoxopcion: Repoxopcion;
      newrepoxopcion = this.formRepoxopcion.value;
      newrepoxopcion.usucrea = this.authService.idusuario!;
      newrepoxopcion.feccrea = new Date();
      this.repoxService.saveRepoxopcion(newrepoxopcion).subscribe({
         next: (nuevo: Repoxopcion) => {
            this.authService.swal('success', `Opción ${newrepoxopcion.codigo} guardada con éxito`);
            this.toggleNuevo();
            this.buscar();
            this.ultIdSelec = nuevo.idrepoxopcion;
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar', err.error) }
      });
   }

   modificar(repoxopcion: Repoxopcion) {
      if (this.swnuevo) this.swnuevo = !this.swnuevo;
      this.swmodifi = !this.swmodifi;
      this.ultIdSelec = repoxopcion.idrepoxopcion;
      this.idrepoxopcion = repoxopcion.idrepoxopcion;
      this.antcodigo = repoxopcion.codigo;
      this.antopcion = repoxopcion.opcion;
      this.antnombre = repoxopcion.nombre;
      this.creaForm();
      this.formRepoxopcion.patchValue({
         codigo: repoxopcion.codigo,
         opcion: repoxopcion.opcion,
         nombre: repoxopcion.nombre
      });
   }

   actualizar() {
      let repoxopcion: Repoxopcion;
      repoxopcion = this.formRepoxopcion.value;
      repoxopcion.usumodi = this.authService.idusuario;
      repoxopcion.fecmodi = new Date();
      this.repoxService.updateRepoxopcion(this.idrepoxopcion, repoxopcion).subscribe({
         next: (actualizado: Repoxopcion) => {
            this.authService.swal('success', `Opción ${repoxopcion.codigo} modificada con éxito`);
            this.swmodifi = !this.swmodifi;
            this.buscar();
            this.ultIdSelec = actualizado.idrepoxopcion;
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al actualizar', err.error) },
      });
   }

   //Datos a eliminar
   eliminar(repoxopcion: Repoxopcion) {
      this.ultIdSelec = repoxopcion.idrepoxopcion;
      this.repojrService.countPorRepoxopcion(repoxopcion.idrepoxopcion).subscribe({
         next: registros => {
            if (registros > 0) {
               Swal.fire({
                  icon: 'error',
                  title: `No puede eliminar el Reporte:\n ${repoxopcion.codigo} ${repoxopcion.nombre}`,
                  text: `Tiene registrado ${registros} Reporte(s) Jasper`,
                  confirmButtonText: '<i class="bi-check"></i> Continuar ',
                  customClass: { popup: 'noeliminar', title: 'robotobig', confirmButton: 'btn btn-warning' },
               });
            } else {
               Swal.fire({
                  icon: 'warning',
                  title: `Eliminar el Reporte:\n${repoxopcion.codigo} ${repoxopcion.nombre} ?`,
                  showCancelButton: true,
                  confirmButtonText: '<i class="fa fa-check"></i> Aceptar',
                  cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
                  customClass: { popup: 'eliminar', title: 'robotobig', confirmButton: 'btn btn-info', cancelButton: 'btn btn-info' },
               }).then((resultado) => {
                  if (resultado.isConfirmed) this.elimina(repoxopcion);
               });
            }
         },
         error: err => {
            console.error('Al buscar si tiene registros: ', err.error)
            this.authService.mostrarError('Error al buscar si tiene registros', err.error);
         },
      });
   }

   //Elimina
   elimina(repoxopcion: Repoxopcion) {
      this.repoxService.deleteRepoxopcion(repoxopcion.idrepoxopcion).subscribe({
         next: () => {
            let eliminado: Eliminadosapp = new Eliminadosapp();
            eliminado.idusuario = this.authService.idusuario!;
            eliminado.modulo = this.authService.moduActual;
            eliminado.fecha = new Date();
            eliminado.routerlink = 'repoxopcion';
            eliminado.tabla = 'REPOXOPCION';
            eliminado.datos = `${repoxopcion.codigo} ${repoxopcion.nombre}`;
            // console.log('eliminado: ', eliminado)
            this.elimService.save(eliminado).subscribe({
               next: () => {
                  this.authService.swal('success', `Reporte ${repoxopcion.codigo} eliminado con éxito`);
                  this.buscar()
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar eliminado', err.error) }
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al eliminar', err.error) }
      });
   }

   cerrar() { this.router.navigate(['/inicio']); }

   soloNumeros(event: KeyboardEvent): void {
      const char = event.key;
      if (!/^\d$/.test(char)) {
         event.preventDefault();
      }
   }

   valCodigo(control: AbstractControl) {
      if (this.swnuevo) {
         return this.repoxService.valCodigo(control.value).pipe(
            map(result => result ? { existe: true } : null)
         );
      } else {
         return this.repoxService.valCodigo(control.value).pipe(
            map(result => control.value != this.antcodigo && result ? { existe: true } : null)
         );
      }
   };

   //Valida nombre
   valNombre(control: AbstractControl) {
      if (this.swnuevo) {
         return this.repoxService.valNombre(control.value).pipe(
            map(result => result ? { existe: true } : null)
         );
      } else {
         return this.repoxService.valNombre(control.value).pipe(
            map(result => control.value != this.antnombre && result ? { existe: true } : null)
         );
      }
   }

}

interface RepoxVisual {
   codigo: string;
   opcion: string;
   nombre: string;
}
