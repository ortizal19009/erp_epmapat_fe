import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AguatramComponent } from './aguatram.component';
import { Aguatramite } from 'src/app/modelos/aguatramite.model';

describe('Aplicacion de tramites sobre la cuenta', () => {
  let c: any, api: any, cuentas: any, pdf: any, eventos: string[];
  beforeEach(() => {
    eventos = [];
    api = { aplicarTramite: jasmine.createSpy().and.callFake(() => {
      eventos.push('guardar'); return of({ idaguatramite: 7 });
    }) };
    cuentas = { updateAbonadoAuditoria: jasmine.createSpy() };
    pdf = { genContratoTramite: jasmine.createSpy().and.callFake(async () => {
      eventos.push('pdf'); throw new Error('PDF no disponible');
    }) };
    c = Object.create(AguatramComponent.prototype);
    Object.assign(c, { s_aguatramite: api, s_abonados: cuentas, s_tramiteagua: pdf,
      authService: { idusuario: 7 }, s_loading: { showLoading() {}, hideLoading() {} },
      abonado: { idabonado: 123, estado: 1, nromedidor: 'MED-123', idcliente_clientes: {} },
      aguatramite: new Aguatramite(), tipoTramite: { idtipotramite: 2 }, date: new Date(),
      f_retiroMedidor: new FormBuilder().group({ fecmedidor: '2026-11-10', ubimedidor: 'Retiro',
        nrodocumento: 'DOC-1', iddocumento_documentos: 1 }) });
    spyOn(c, 'confirmarTramiteConCorreo').and.resolveTo([]);
    spyOn(c, 'validarAbonadoSeleccionado').and.returnValue(true);
    spyOn(c, 'enviarCorreoComprobante').and.resolveTo();
    spyOn(c, 'regresar'); spyOn(c, 'swal'); spyOn(console, 'error');
  });
  it('guarda retiro y cuenta juntos antes del PDF y termina aunque falle el PDF', async () => {
    await c.retiroMedidor();
    expect(api.aplicarTramite).toHaveBeenCalledTimes(1);
    expect(api.aplicarTramite.calls.mostRecent().args[1].estado).toBe(3);
    expect(cuentas.updateAbonadoAuditoria).not.toHaveBeenCalled();
    expect(eventos).toEqual(['guardar', 'pdf']); expect(c.regresar).toHaveBeenCalled();
    expect(c.abonado.estado).toBe(3); expect(c.procesandoTramite).toBeFalse();
  });
  it('mantiene la cuenta original y permite reintentar si falla la operacion', async () => {
    api.aplicarTramite.and.returnValue(throwError(() => new Error('Fallo de guardado')));
    await c.retiroMedidor();
    expect(c.abonado.estado).toBe(1); expect(pdf.genContratoTramite).not.toHaveBeenCalled();
    expect(c.regresar).not.toHaveBeenCalled(); expect(c.procesandoTramite).toBeFalse();
  });
  it('envia categoria y beneficios en la misma operacion', async () => {
    c.tipoTramite = { idtipotramite: 9 };
    c.f_categoria = new FormBuilder().group({ idcategoria_categorias: { idcategoria: 4 },
      adultomayor: true, municipio: false, observaciones: 'Cambio', nrodocumento: 'DOC-2', iddocumento_documentos: 1 });
    await c.actualizarCategoria();
    const datos = api.aplicarTramite.calls.mostRecent().args[1];
    expect(datos.idcategoria_categorias.idcategoria).toBe(4); expect(datos.adultomayor).toBeTrue();
    expect(datos.estado).toBe(1); expect(cuentas.updateAbonadoAuditoria).not.toHaveBeenCalled();
    expect(c.regresar).toHaveBeenCalled();
  });
});
