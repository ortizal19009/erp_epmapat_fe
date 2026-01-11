import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
})
export class UsuariosComponent implements OnInit {
  f_usuario!: FormGroup;

  _usuarios: any;
  filtro: string = '';

  // Modal eliminar
  usuario = {} as Usuario;
  otraPagina: boolean = false;

  // Fecha / password
  date: Date = new Date();
  pass: string = '';

  // Personal (para unir)
  _personal: any[] = [];
  filtrarPersonalAdd: string = '';
  personalSeleccionadoId: number | null = null;
  personalSeleccionadoLabel: string = '';

  constructor(
    public usuService: UsuarioService,
    private router: Router,
    public authService: AutorizaService,
    private coloresService: ColoresService,
    private fb: FormBuilder,
    private personalService: PersonalService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/usuarios');
    const coloresJSON = sessionStorage.getItem('/usuarios');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    // FORM
    this.f_usuario = this.fb.group({
      identificausu: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      nomusu: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: ['', [Validators.email]],
      alias: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      password: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]],
      conf_password: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]],

      // 🔹 control para personal (se llenará con {idpersonal})
      personal: new FormControl(null),
    });

    this.listarUsuarios();
    this.getListarPersonal();

    // Si cambia password, resetea confirmación y pass encriptada
    this.f_usuario.get('password')?.valueChanges.subscribe((v) => {
      if (v) {
        this.f_usuario.get('conf_password')?.reset();
        this.pass = '';
      }
    });
  }

  // =========================
  // COLORES
  // =========================
  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(this.authService.idusuario, 'usuarios');
      sessionStorage.setItem('/usuarios', JSON.stringify(datos));
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
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

  // =========================
  // LISTADOS
  // =========================
  listarUsuarios() {
    this.usuService.getUsuarios().subscribe({
      next: (datos) => (this._usuarios = datos),
      error: (err) => console.error(err.error),
    });
  }

  getListarPersonal() {
    this.personalService.getAllPersonal().subscribe({
      next: (datos: any) => (this._personal = datos),
      error: (err: any) => console.error(err.error),
    });
  }

  // =========================
  // ACCIONES USUARIOS
  // =========================
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
    // Implementa si ya tienes endpoint:
    // this.usuService.deleteUsuario(this.usuario.idusuario).subscribe({
    //   next: () => this.listarUsuarios(),
    //   error: (err) => console.error(err.error),
    // });
  }

  // =========================
  // PASSWORD
  // =========================
  verifyPassword(e: any) {
    const password = this.f_usuario.value.password;
    const conf_password = e.target.value;

    if (conf_password === password && password && password.trim().length > 0) {
      this.pass = myFun(password);
    } else {
      this.pass = '';
    }
  }

  // =========================
  // UNIR PERSONAL (ADD)
  // =========================
  seleccionarPersonalAdd(per: any) {
    this.personalSeleccionadoId = per.idpersonal;
    this.personalSeleccionadoLabel = `${per.apellidos} ${per.nombres} - ${per.identificacion}`;

    // Enviar SOLO idpersonal al backend:
    this.f_usuario.get('personal')?.setValue({ idpersonal: per.idpersonal });
    this.f_usuario.markAsDirty();
  }

  limpiarPersonalAdd() {
    this.personalSeleccionadoId = null;
    this.personalSeleccionadoLabel = '';
    this.filtrarPersonalAdd = '';

    this.f_usuario.get('personal')?.setValue(null);
    this.f_usuario.markAsDirty();
  }

  // =========================
  // GUARDAR NUEVO USUARIO
  // =========================
  saveUser() {
    if (this.f_usuario.invalid) return;

    // Asegurar que password coincide y pass está lista
    const p = this.f_usuario.get('password')?.value;
    const c = this.f_usuario.get('conf_password')?.value;
    if (p !== c) {
      this.pass = '';
      return;
    }
    if (!this.pass) this.pass = myFun(p);

    const raw = this.f_usuario.getRawValue();

    const user: any = new Usuarios();
    user.codusu = this.pass;
    user.email = raw.email;
    user.identificausu = raw.identificausu;
    user.nomusu = raw.nomusu;
    user.alias = raw.alias;

    // relación personal (opcional)
    // raw.personal ya es {idpersonal} o null
    user.personal = raw.personal;

    user.feccrea = this.date;
    user.estado = true;
    user.usucrea = this.authService.idusuario; // si tienes usucrea en tu entidad
    user.usumodi = this.authService.idusuario;
    user.otrapestania = true;

    this.usuService.save(user).subscribe({
      next: () => {
        this.listarUsuarios();
        this.resetFormAdd();
      },
      error: (e: any) => console.error(e),
    });
  }

  resetFormAdd() {
    this.f_usuario.reset();
    this.pass = '';
    this.limpiarPersonalAdd();
  }

  // =========================
  // PDF (tu método se mantiene igual)
  // =========================
  pdf() {
    let m_izquierda = 20;
    const doc = new jsPDF();

    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);

    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('LISTA DE USUARIOS', m_izquierda, 16);

    // ⚠️ OJO: tu pdf actual usa campos anio/mes/porcentaje que no son de usuarios.
    // Te lo dejo intacto, pero si quieres lo ajusto a: identificausu, alias, nomusu.

    const datos: any[] = [];
    let nombreMes: string;
    let i = 0;

    this._usuarios.forEach(() => {
      let mes = +this._usuarios[i].mes!;
      switch (mes) {
        case 1: nombreMes = 'Enero'; break;
        case 2: nombreMes = 'Febrero'; break;
        case 3: nombreMes = 'Marzo'; break;
        case 4: nombreMes = 'Abril'; break;
        case 5: nombreMes = 'Mayo'; break;
        case 6: nombreMes = 'Junio'; break;
        case 7: nombreMes = 'Julio'; break;
        case 8: nombreMes = 'Agosto'; break;
        case 9: nombreMes = 'Septiembre'; break;
        case 10: nombreMes = 'Octubre'; break;
        case 11: nombreMes = 'Noviembre'; break;
        case 12: nombreMes = 'Diciembre'; break;
        default: nombreMes = ''; break;
      }

      datos.push([
        this._usuarios[i].anio,
        nombreMes,
        this._usuarios[i].porcentaje.toFixed(2),
      ]);
      i++;
    });

    const cabecera = ['AÑO', 'MES', '%'];

    autoTable(doc, {
      theme: 'grid',
      headStyles: { fillColor: [83, 67, 54], fontStyle: 'bold', halign: 'center' },
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 1, halign: 'center' },
      columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' }, 2: { halign: 'right' } },
      margin: { left: m_izquierda - 1, top: 18, right: 90, bottom: 10 },
      head: [cabecera],
      body: datos,
    });

    const opciones: any = {
      filename: 'usuarios.pdf',
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    };

    if (this.otraPagina) doc.output('dataurlnewwindow', opciones);
    else {
      const pdfDataUri = doc.output('datauristring');

      const elementoExistente = document.getElementById('idembed');
      if (elementoExistente) elementoExistente.remove();

      const embed = document.createElement('embed');
      embed.setAttribute('src', pdfDataUri);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '50%');
      embed.setAttribute('height', '100%');
      embed.setAttribute('id', 'idembed');

      const container: any = document.getElementById('pdf');
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
  for (let i = 0; i < x.length; i++) y += String(x.charCodeAt(i));

  let rtn = '';
  for (let i = 0; i < y.length; i += 2) rtn += y[i];

  rtn += String(x.trim().length);

  for (let i = y.length - 1; i >= 0; i -= 2) rtn += y[i];

  return rtn;
}
