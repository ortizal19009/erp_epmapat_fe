import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NcEndososListadoComponent } from './nc-endosos-listado.component';
@NgModule({declarations:[NcEndososListadoComponent],imports:[CommonModule,FormsModule,RouterModule.forChild([{path:'',component:NcEndososListadoComponent}])]})
export class NcEndososListadoModule {}
