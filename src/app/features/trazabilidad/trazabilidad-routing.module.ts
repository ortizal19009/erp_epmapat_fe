import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrackingMonitorComponent } from './pages/tracking-monitor/tracking-monitor.component';
import { AuthGuard } from '../../servicios/administracion/auth-guard';

const routes: Routes = [
  {
    path: '',
    component: TrackingMonitorComponent,
    canActivate: [AuthGuard],
    data: { windowPermission: 'trazabilidad' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrazabilidadRoutingModule { }
