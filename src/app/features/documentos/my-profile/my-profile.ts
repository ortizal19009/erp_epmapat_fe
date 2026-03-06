import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gd-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-profile.html'
})
export class GdMyProfileComponent {
  userId = '';
  role = 'RECEPCION';
  dependencyId = '';

  roles = ['RECEPCION', 'RESPONSABLE', 'SUPERVISOR', 'ADMIN'];

  constructor() {
    try {
      this.userId = globalThis.localStorage?.getItem('gd.user_id') || '';
      this.role = (globalThis.localStorage?.getItem('gd.role') || 'RECEPCION').toUpperCase();
      this.dependencyId = globalThis.localStorage?.getItem('gd.dependency_id') || '';
    } catch {}
  }

  save(): void {
    try {
      globalThis.localStorage?.setItem('gd.user_id', this.userId || '');
      globalThis.localStorage?.setItem('gd.role', this.role || 'RECEPCION');
      globalThis.localStorage?.setItem('gd.dependency_id', this.dependencyId || '');
      alert('Perfil GD guardado. Se recargará la vista.');
      globalThis.location?.reload();
    } catch {
      alert('No se pudo guardar el perfil GD');
    }
  }
}
