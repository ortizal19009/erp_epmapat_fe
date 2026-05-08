import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class PersonalValidators {
  static cedulaEcuatoriana(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value || '').trim();
      if (!value) return null;
      if (!/^\d{10}$/.test(value)) return { cedulaEcuatoriana: true };

      const province = Number(value.substring(0, 2));
      const thirdDigit = Number(value.substring(2, 3));
      if (province < 1 || province > 24 || thirdDigit > 5) {
        return { cedulaEcuatoriana: true };
      }

      const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
      const sum = coefficients.reduce((total, coefficient, index) => {
        let product = Number(value[index]) * coefficient;
        if (product >= 10) product -= 9;
        return total + product;
      }, 0);
      const verifier = sum % 10 === 0 ? 0 : 10 - (sum % 10);

      return verifier === Number(value[9]) ? null : { cedulaEcuatoriana: true };
    };
  }

  static edadMinima(minYears: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const birthDate = new Date(control.value);
      if (Number.isNaN(birthDate.getTime())) return { fechaInvalida: true };

      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      const monthDelta = today.getMonth() - birthDate.getMonth();
      if (
        monthDelta < 0 ||
        (monthDelta === 0 && today.getDate() < birthDate.getDate())
      ) {
        years--;
      }

      return years >= minYears
        ? null
        : { edadMinima: { minYears, actualYears: years } };
    };
  }
}
