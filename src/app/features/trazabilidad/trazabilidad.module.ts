import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrazabilidadRoutingModule } from './trazabilidad-routing.module';
import { TrackingMonitorComponent } from './pages/tracking-monitor/tracking-monitor.component';

@NgModule({
  declarations: [
    TrackingMonitorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TrazabilidadRoutingModule
  ]
})
export class TrazabilidadModule { }
