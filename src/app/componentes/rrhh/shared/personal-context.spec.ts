import { personalFromContext } from './personal-context';
describe('Contexto del empleado desde su ficha', () => {
  const list = [{idpersonal: 2}, {idpersonal: 7}];
  it('selecciona el empleado solicitado aunque no sea el primero', () => expect(personalFromContext(list, '7')).toBe(7));
  it('no selecciona otro empleado ante un enlace inválido o inexistente', () => {
    for (const id of ['999', 'NaN', '', '-1', '1.5']) expect(personalFromContext(list,id)).toBe(0);
  });
  it('mantiene el comportamiento general al entrar sin contexto', () => expect(personalFromContext(list,null)).toBe(2));
  it('admite una lista vacía', () => expect(personalFromContext([], '7')).toBe(0));
});
