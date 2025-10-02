import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-add-homologa',
  templateUrl: './add-homologa.component.html',
  styleUrls: ['./add-homologa.component.css']
})
export class AddHomologaComponent implements OnInit {

  @Output() cancelarEvent = new EventEmitter<boolean>();
  @Input() niifcuenta: any;

  titulo: string = 'Homologación de cuentas NIIF';
  homologacionesNiif: any;
  nefcuentas: any;
  filterTerm: string;
  f_cuentasniif: FormGroup;
  cuentas: any = [];
  
  constructor() { }

  ngOnInit(): void {
  }

}
