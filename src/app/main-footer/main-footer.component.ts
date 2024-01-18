import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-footer',
  templateUrl: './main-footer.component.html',
  styleUrls: ['./main-footer.component.css']
})

export class MainFooterComponent implements OnInit{

  fondo1: number;

  constructor() { }

  ngOnInit(): void {
    let fondoActual = sessionStorage.getItem("fondoActual")?.toString();
    this.fondo1 = +fondoActual!
  }

  public fondo( fondo1: number){
    this.fondo1 = fondo1;
    window.location.reload();
  }

}
