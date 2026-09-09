import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AutorizaService } from './compartida/autoriza.service';
import { ReadOnlyUiService } from './compartida/read-only-ui.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

  title = 'EpmapaT';
  isLoginSuccessful: Boolean = false;

  constructor (private router:Router, public authService: AutorizaService,
    private readOnlyUiService: ReadOnlyUiService ){ 
  }

  ngOnInit(): void {
    this.readOnlyUiService.start();
  }

}
