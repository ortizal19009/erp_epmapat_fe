import { cuentaRealTramite } from './aguatramite-cuenta';

describe('Cuenta real del tramite de agua', () => {
  it('muestra el idabonado aunque el medidor y el vecino tengan otros numeros', () => {
    expect(cuentaRealTramite({ idabonado: 123, codmedidor: '987654', codmedidorvecino: 456 })).toBe('123');
  });
  it('no inventa una cuenta con el medidor, el vecino o un campo ambiguo', () => {
    expect(cuentaRealTramite({ codmedidor: '987654', codmedidorvecino: 456, cuenta: 789 })).toBe('');
    expect(cuentaRealTramite({ idabonado: null, idtramitenuevo_tramitenuevo: { codmedidorvecino: 456 } })).toBe('');
  });
  it('recupera la vinculacion explicita del tramite nuevo antes que cualquier vecino', () => {
    expect(cuentaRealTramite({ codmedidorvecino: 456, idaguatramite_aguatramite: { idabonado: 123 } })).toBe('123');
  });
  it('ignora identificadores vacios, cero y valores que no son IDs', () => {
    for (const valor of [null, undefined, 0, -1, true, false, {}, [], 'abc', '1.5']) {
      expect(cuentaRealTramite({ idabonado: valor, codmedidor: '999' })).toBe('');
    }
    expect(cuentaRealTramite({ idabonado_abonados: { idabonado: '123' } })).toBe('123');
  });
});
