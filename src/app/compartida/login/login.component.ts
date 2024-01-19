import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '../autoriza.service';

@Component({
   selector: 'app-login',
   templateUrl: './login.component_old.html',
   styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit{

   formLogin: FormGroup;
   // PDFOld: Boolean = false;

   constructor(private router: Router, public fb: FormBuilder, private authService: AutorizaService) { }

   ngOnInit(): void {

      // this.PDFOld = Boolean(sessionStorage.getItem('PDFOld'))

      this.formLogin = this.fb.group({
         username: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
         password: [null, Validators.required ],
      });
   }

   login() {


   //  this.PDFOld = true;
   //  sessionStorage.setItem("PDFOld", this.PDFOld.toString());
    this.authService.enabModulos();


 }

}
