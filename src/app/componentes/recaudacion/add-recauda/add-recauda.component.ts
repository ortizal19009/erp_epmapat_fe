import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RecaudacionService } from 'src/app/servicios/microservicios/recaudacion.service';

@Component({
  selector: 'app-add-recauda',
  templateUrl: './add-recauda.component.html',
  styleUrls: ['./add-recauda.component.css'],
})
export class AddRecaudaComponent implements OnInit {
  filtrar: string;
  constructor(
    private fb: FormBuilder,
    private ms_recaudacion: RecaudacionService
  ) {}

  ngOnInit(): void {
    this.getSinCobro(300);
  }

  async getSinCobro(cuenta: number) {
    let sincobro = await ( this.ms_recaudacion.getSincobroByCuenta(cuenta));
    console.log(sincobro)
  }
}
