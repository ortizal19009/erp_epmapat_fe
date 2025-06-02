import { Component, OnInit } from '@angular/core';
import { EmisionService } from 'src/app/servicios/emision.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  _resumenEmisiones: any;
  constructor(private s_emisiones: EmisionService) {}

  ngOnInit(): void {
    /* https://www.youtube.com/watch?v=e4urW6Ud3WU  */
    this.getResumenEmisiones(12);
  }
  async getResumenEmisiones(limit: number) {
    this._resumenEmisiones = await this.s_emisiones.getResumenEmision(limit);
    console.log(this._resumenEmisiones);
  }
}
