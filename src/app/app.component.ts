import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AutorizaService } from './compartida/autoriza.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  title = 'EpmapaT';
  isLoginSuccessful: Boolean = false;

  constructor (private router:Router, public authService: AutorizaService ){ 
  }

}
