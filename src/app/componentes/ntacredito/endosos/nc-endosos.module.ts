import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NcEndososComponent } from './nc-endosos.component';
@NgModule({declarations:[NcEndososComponent],imports:[CommonModule,FormsModule,ReactiveFormsModule,RouterModule.forChild([{path:'',component:NcEndososComponent}])]})
export class NcEndososModule {}
