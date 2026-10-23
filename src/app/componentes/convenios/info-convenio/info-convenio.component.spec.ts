import { InfoConvenioComponent } from './info-convenio.component';
import { ConveniosReportsService } from '../convenios-reports.service';

describe('InfoConvenioComponent: columnas valor e intereses', () => {
  const report = new ConveniosReportsService({ header: () => {} } as any);
  let component: InfoConvenioComponent;
  beforeEach(() => {
    component = new InfoConvenioComponent(
      {} as any, {} as any, {} as any, {} as any,
      {} as any, {} as any, report, {} as any
    );
    component.convenio.totalconvenio = 0.6;
    component._cuotas = [0.1, 0.2].map((capital, i) => ({
      nrocuota: i + 1, capital, interesacobrar: 0.16,
      rubros: [
        { cantidad: 1, valorunitario: capital, idrubro_rubros: { idrubro: 1 } },
        { cantidad: 1, valorunitario: 0.15, idrubro_rubros: { idrubro: 5 } },
      ],
      idfactura: { totaltarifa: i === 0 ? 999 : 1 },
    }));
  });

  it('suma las columnas en centavos y compara contra el valor pactado sin mora', () => {
    component.totalCuotas();
    expect(component.total1).toBe(0.3);
    expect(component.totalInteres).toBe(0.32);
    expect(component.dif1).toBeFalse();
    expect(component.diferenciaCuotas).toBe(0);
  });

  it('ordena por el capital visible y no por totaltarifa', () => {
    component.cuotaSortColumn = 'valor';
    expect(component.cuotasOrdenadas.map(c => c.nrocuota)).toEqual([1, 2]);
  });
});
