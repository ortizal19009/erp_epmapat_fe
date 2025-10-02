import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-c1',
  templateUrl: './c1.component.html'
})
export class C1Component implements OnInit {
  seleccionado="Opcion 2";
  lista:string[]=["Opcion 1","Opcion 2","Opcion 3", "Opcion 4"];

  constructor() { }

  ngOnInit(): void {
  }

}
