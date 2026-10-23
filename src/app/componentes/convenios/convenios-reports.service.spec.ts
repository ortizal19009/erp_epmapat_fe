import { ConveniosReportsService } from './convenios-reports.service';

describe('ConveniosReportsService: capital desde rubros', () => {
  const service = new ConveniosReportsService({ header: () => {} } as any);
  const rubros = [
    { cantidad: 2, valorunitario: 40, idrubro_rubros: { idrubro: 1 }, estado: 1 },
    { cantidad: 1, valorunitario: 20, idrubro_rubros: { idrubro: 2 }, estado: null },
    { cantidad: 1, valorunitario: 10, idrubro_rubros: { idrubro: 5 }, estado: 1 },
    { cantidad: 1, valorunitario: 999, idrubro_rubros: { idrubro: 1 }, estado: 0 },
  ];

  it('ignora totaltarifa y valorbase y suma el interes consolidado una sola vez', () => {
    expect(service.calcularMontosCuota({
      rubros, interesMora: 2.35,
      idfactura: { pagado: 0, totaltarifa: 112.35, valorbase: 110 },
    })).toEqual({ capital: 100, interes: 12.35, total: 112.35 });
  });

  it('el interes cobrado incluye el rubro 5 en las cuotas pagadas', () => {
    expect(service.calcularMontosCuota({
      rubros, interesMora: 2.35,
      idfactura: { pagado: 1, interescobrado: 12.35, totaltarifa: 112.35 },
    })).toEqual({ capital: 100, interes: 12.35, total: 112.35 });
  });

  it('respeta el interes cobrado cero y no suma intereses consolidados nuevamente', () => {
    expect(service.calcularMontosCuota({
      rubros, idfactura: { pagado: 1, interescobrado: 0 },
    })).toEqual({ capital: 100, interes: 0, total: 100 });
  });

  it('incluye el consolidado sin mora al crear el convenio', () => {
    expect(service.calcularMontosCuota({ rubros, interesMora: 0 }))
      .toEqual({ capital: 100, interes: 10, total: 110 });
  });

  it('no usa totaltarifa como sustituto de rubros faltantes', () => {
    expect(() => service.calcularMontosCuota({ idfactura: { totaltarifa: 110 } }))
      .toThrowError(/rubros/);
  });
  it('redondea cada rubro hacia arriba como recaudacion, sin errores binarios', () => {
    expect(service.calcularMontosCuota({
      rubros: [
        { cantidad: '3', valorunitario: '0.333', idrubro_rubros: { idrubro: 1 } },
        { cantidad: 1, valorunitario: '1.001', idrubro_rubros: { idrubro: 2 } },
        { cantidad: 1, valorunitario: '10.79', idrubro_rubros: { idrubro: 3 } },
        { cantidad: 1, valorunitario: '0.071', idrubro_rubros: { idrubro: 5 } },
      ], interesMora: '0.001', idfactura: { pagado: 0, totaltarifa: 999 },
    })).toEqual({ capital: 12.8, interes: 0.09, total: 12.89 });
  });

  it('redondea importes negativos alejandose de cero y admite exponentes', () => {
    expect(service.calcularMontosCuota({ rubros: [
      { cantidad: 1, valorunitario: '-1.001', idrubro_rubros: { idrubro: 1 } },
      { cantidad: 1, valorunitario: '1e-3', idrubro_rubros: { idrubro: 2 } },
    ] })).toEqual({ capital: -1, interes: 0, total: -1 });
  });

});
