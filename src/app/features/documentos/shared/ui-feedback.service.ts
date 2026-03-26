import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class UiFeedbackService {
  toast(icon: 'success' | 'error' | 'warning' | 'info', title: string, ms: number = 2500): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      showConfirmButton: false,
      timer: ms,
      timerProgressBar: true,
    });
  }

  async confirm(title: string, text: string, confirmButtonText: string): Promise<boolean> {
    const res = await Swal.fire({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Cancelar'
    });
    return !!res.isConfirmed;
  }
}

