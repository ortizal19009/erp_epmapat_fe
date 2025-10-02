import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-c2',
  templateUrl: './c2.component.html',
  providers: [DatePipe]
})


export class C2Component implements OnInit {

  todayNumber: number = Date.now();
  todayDate : Date = new Date();
  todayString : string = new Date().toDateString();
  todayISOString : string = new Date().toISOString();
  
  constructor() { }
  
  ngOnInit(): void {}
}