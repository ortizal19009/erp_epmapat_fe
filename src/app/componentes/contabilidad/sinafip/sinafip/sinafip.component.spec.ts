import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { SinafipComponent } from './sinafip.component';
import { ResultadoSinafip } from 'src/app/servicios/contabilidad/sinafip.service';

describe('SINAFIP', () => {
  let component: SinafipComponent;
  let service: any;
  const resultado: ResultadoSinafip = { archivo: 'apertura', anio: 2026, periodo: 1, corte: '2026-12-31', avisos: [],
    bloques: [{ nombre: 'Apertura', columnas: ['Periodo','Cuenta','Subcuenta','Auxiliar','Debe','Haber'],
      filas: [['01','111','01','00','383,02','0,00']] }] };
  beforeEach(() => {
    service = { generar: jasmine.createSpy().and.returnValue(of(resultado)) };
    component = new SinafipComponent(new FormBuilder(), { setcolor: () => Promise.resolve(['#fff','#fff']) } as any,
      { anio: 2026, idusuario: 1 } as any, service);
    component.ngOnInit();
  });

  it('formatea igual que TXT PowerBuilder sin BOM, sin cabeceras y con CRLF final', () => {
    expect(component.texto(resultado)).toBe('01|111|01|00|383,02|0,00\r\n');
    expect(component.texto({ ...resultado, bloques: [] })).toBe('');
  });

  it('espera los datos y consulta nuevamente cuando cambia el periodo', async () => {
    component.formSinafip.patchValue({ archivo: 'balance', periodo: 2 });
    await component.generar(false);
    expect(service.generar).toHaveBeenCalledWith('balance',2026,2);
    expect(component.generando).toBeFalse();
    component.formSinafip.patchValue({ periodo: 3 });
    expect(component.resultado).toBeNull();
    await component.generar(false);
    expect(service.generar).toHaveBeenCalledWith('balance',2026,3);
  });

  it('consulta reciprocas y recupera el estado ante un error', async () => {
    component.formSinafip.patchValue({ archivo: 'reciprocas' });
    await component.generar(false); expect(service.generar).toHaveBeenCalledWith('reciprocas',2026,1);
    component.formSinafip.patchValue({ archivo: 'apertura' });
    service.generar.and.returnValue(throwError(() => ({ error: { message: 'Ejercicio incorrecto' } })));
    await component.generar(false);
    expect(component.error).toBe('Ejercicio incorrecto'); expect(component.generando).toBeFalse();
  });

  it('descarga TXT o Excel desde el mismo resultado de la vista previa', async () => {
    const txt = spyOn(component, 'descargarTxt');
    const excel = spyOn(component, 'descargarExcel').and.returnValue(Promise.resolve());
    await component.generar(); expect(txt).toHaveBeenCalledWith(resultado);
    component.formSinafip.patchValue({ tipo: 'xlsx' });
    await component.generar(); expect(excel).toHaveBeenCalledWith(resultado);
    expect(service.generar).toHaveBeenCalledTimes(1);
    expect(component.nombreArchivo('txt')).toBe('AI_2026_01.txt');
  });
  it('compara referencias sin ignorar filas duplicadas ni espacios de los campos', () => {
    component.resultado = resultado;
    component.compararTexto('01|111|01|00|383,02|0,00\n', 'anterior.txt');
    expect(component.comparacion?.iguales).toBe(1);
    expect(component.comparacion?.soloAnterior.length).toBe(0);
    component.compararTexto('01|111|01|00|383,02|0,00\n01|111|01|00|383,02|0,00\n', 'duplicado.txt');
    expect(component.comparacion?.soloAnterior.length).toBe(1);
  });

  it('revisa y guarda contrapartidas solo al solicitarlo e invalida el resultado anterior', async () => {
    const fila: any = { origen: 'benextran', idregistro: 1, inttra: 433, asiento: 10, codcue: '112.05',
      nomben: 'Proveedor', codcuereci: '213.01', codparreci: null, asierefe: 10 };
    service.asignaciones = jasmine.createSpy().and.returnValue(of([fila]));
    service.cuentas = jasmine.createSpy().and.returnValue(of([{ codcue: '213.01', nomcue: 'Cuenta' }]));
    service.asignar = jasmine.createSpy().and.returnValue(of(undefined));
    expect(service.asignar).not.toHaveBeenCalled();
    await component.revisarAsignaciones();
    expect(component.asignaciones?.length).toBe(1);
    component.resultado = resultado;
    await component.guardarAsignacion(fila);
    expect(service.asignar).toHaveBeenCalledWith(fila);
    expect(fila.guardado).toBeTrue();
    expect(component.resultado).toBeNull();
    expect(component.guardandoAsignacion).toBeNull();
  });

});
