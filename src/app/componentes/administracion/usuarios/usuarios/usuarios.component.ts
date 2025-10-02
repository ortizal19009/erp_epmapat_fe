import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
})
export class UsuariosComponent implements OnInit {
  f_usuario: FormGroup;
  _usuarios: any;
  mostrarComponente: boolean = false;
  componente: any;
  usuario = {} as Usuario; //Interface para los datos del Usuario a eliminar
  otraPagina: boolean = false;
  tsvData: any[] = [];
  filtro: string;
  date: Date = new Date();
  pass: any = '';
  constructor(
    public usuService: UsuarioService,
    private router: Router,
    public authService: AutorizaService,
    private coloresService: ColoresService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // if(!this.authService.log) this.router.navigate(['/inicio']);
    this.f_usuario = this.fb.group({
      identificausu: '',
      nomusu: '',
      email: '',
      alias: '',
      password: '',
      conf_password: '',
    });

    sessionStorage.setItem('ventana', '/usuarios');
    let coloresJSON = sessionStorage.getItem('/usuarios');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.listarUsuarios();
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(
        this.authService.idusuario,
        'usuarios'
      );
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/usuarios', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }
  verifyPassword(e: any) {
    let password = this.f_usuario.value.password;
    let conf_password = e.target.value;
    if (conf_password === password) {
      this.pass = myFun(password);
    } else {
      this.pass = '';
    }
  }
  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  listarUsuarios() {
    this.usuService.getUsuarios().subscribe({
      next: (datos) => (this._usuarios = datos),
      error: (err) => console.error(err.error),
    });
  }

  nuevo() {
    this.mostrarComponente = true;
    //this.componente = AddInteresesComponent;  //Cambiar a AddUsuarioComponent
  }

  perfil(idusuario: number) {
    sessionStorage.setItem('idusuarioToPerfil', idusuario.toString());
    this.router.navigate(['/perfil-usuario']);
  }

  modificar(idusuario: number) {
    sessionStorage.setItem('idusuarioToModi', idusuario.toString());
    this.router.navigate(['/modi-usuario']);
  }

  datosEliminar(usuario: Usuarios) {
    this.usuario.idusuario = usuario.idusuario;
    this.usuario.identificausu = usuario.identificausu;
    this.usuario.nomusu = usuario.nomusu;
  }

  eliminar() {
    // this.usuService.deleteUsuario(this.usuario.idusuario).subscribe({
    //    next: datos => this.listarUsuarios(),
    //    error: err => console.log(err.error)
    // });
  }

  reset() {
    this.componente = null;
  }

  saveUser() {
    let user: Usuarios = new Usuarios();
    user.codusu = this.pass;
    user.email = this.f_usuario.value.email;
    user.identificausu = this.f_usuario.value.identificausu;
    user.nomusu = this.f_usuario.value.nomusu;
    user.alias = this.f_usuario.value.alias;
    user.feccrea = this.date;
    user.estado = true;
    user.usumodi = this.authService.idusuario;
    user.otrapestania = true;
    console.log(user);
    this.usuService.save(user).subscribe({
      next: (datos: any) => {
        console.log(datos);
        this.listarUsuarios();
        this.f_usuario.reset();
      },
      error: (e: any) => console.error(e),
    });
  }

  pdf() {
    let m_izquierda = 20;
    var doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('LISTA DE USUARIOS', m_izquierda, 16);

    var datos: any = [];
    let nombreMes: string;
    var i = 0;
    this._usuarios.forEach(() => {
      let mes = +this._usuarios[i].mes!;
      switch (mes) {
        case 1:
          nombreMes = 'Enero';
          break;
        case 2:
          nombreMes = 'Febrero';
          break;
        case 3:
          nombreMes = 'Marzo';
          break;
        case 4:
          nombreMes = 'Abril';
          break;
        case 5:
          nombreMes = 'Mayo';
          break;
        case 6:
          nombreMes = 'Junio';
          break;
        case 7:
          nombreMes = 'Julio';
          break;
        case 8:
          nombreMes = 'Agosto';
          break;
        case 9:
          nombreMes = 'Septiembre';
          break;
        case 10:
          nombreMes = 'Octubre';
          break;
        case 11:
          nombreMes = 'Noviembre';
          break;
        case 12:
          nombreMes = 'Diciembre';
          break;
        default:
          nombreMes = '';
          break;
      }
      datos.push([
        this._usuarios[i].anio,
        nombreMes,
        this._usuarios[i].porcentaje.toFixed(2),
      ]);
      i++;
    });

    let cabecera = ['AÑO', 'MES', '%'];

    autoTable(doc, {
      theme: 'grid',
      headStyles: {
        fillColor: [83, 67, 54],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'left' },
        2: { halign: 'right' },
      },

      margin: { left: m_izquierda - 1, top: 18, right: 90, bottom: 10 },
      head: [cabecera],
      body: datos,
    });

    var opciones = {
      filename: 'intereses.pdf',
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    };

    if (this.otraPagina) doc.output('dataurlnewwindow', opciones);
    else {
      const pdfDataUri = doc.output('datauristring');
      //Si ya existe el <embed> primero lo remueve
      const elementoExistente = document.getElementById('idembed');
      if (elementoExistente) {
        elementoExistente.remove();
      }
      //Crea el <embed>
      var embed = document.createElement('embed');
      embed.setAttribute('src', pdfDataUri);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '50%');
      embed.setAttribute('height', '100%');
      embed.setAttribute('id', 'idembed');
      //Agrega el <embed> al contenedor del Modal
      var container: any;
      container = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }
}

interface Usuario {
  idusuario: number;
  identificausu: string;
  nomusu: string;
}
function myFun(x: string): string {
  let y = '';
  for (let i = 0; i < x.length; i++) {
    y += String(x.charCodeAt(i));
  }
  let rtn = '';
  for (let i = 0; i < y.length; i += 2) {
    rtn += y[i];
  }
  rtn += String(x.trim().length);
  for (let i = y.length - 1; i >= 0; i -= 2) {
    rtn += y[i];
  }
  return rtn;
}
