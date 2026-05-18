import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';

@Component({
  selector: 'app-usuario-autocomplete',
  templateUrl: './usuario-autocomplete.component.html',
})
export class UsuarioAutocompleteComponent implements OnInit {
  @Input() placeholder = 'Buscar usuario';
  @Input() disabled = false;
  @Input() selectedUserId: number | null = null;
  @Output() userSelected = new EventEmitter<Usuarios | null>();

  usuarios: Usuarios[] = [];
  sugerencias: Usuarios[] = [];
  searchTerm = '';
  cargando = false;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private cargarUsuarios(): void {
    this.cargando = true;
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = (usuarios || []).filter((usuario) => usuario?.estado !== false);
        if (this.selectedUserId) {
          const selectedUserId = this.selectedUserId;
          const usuarioSeleccionado =
            this.usuarios.find((usuario) => +usuario.idusuario === +selectedUserId) || null;
          this.searchTerm = usuarioSeleccionado?.nomusu || '';
        }
        this.cargando = false;
      },
      error: () => {
        this.usuarios = [];
        this.cargando = false;
      },
    });
  }

  onInputChange(value: string): void {
    this.searchTerm = value;
    const criterio = String(value || '').trim().toLowerCase();

    if (!criterio) {
      this.sugerencias = [];
      this.userSelected.emit(null);
      return;
    }

    this.sugerencias = this.usuarios
      .filter((usuario) =>
        [usuario.nomusu, usuario.alias, usuario.identificausu]
          .filter(Boolean)
          .some((campo) => String(campo).toLowerCase().includes(criterio))
      )
      .slice(0, 8);
  }

  seleccionarUsuario(usuario: Usuarios): void {
    this.searchTerm = usuario.nomusu ?? usuario.alias ?? '';
    this.sugerencias = [];
    this.userSelected.emit(usuario);
  }

  limpiar(): void {
    this.searchTerm = '';
    this.sugerencias = [];
    this.userSelected.emit(null);
  }
}
