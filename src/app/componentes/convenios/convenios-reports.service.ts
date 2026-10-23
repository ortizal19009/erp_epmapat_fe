import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TemplateHeaderService } from 'src/app/servicios/template-header.service';

@Injectable({
  providedIn: 'root',
})
export class ConveniosReportsService {
  constructor(private header: TemplateHeaderService) {}

  impContratoConvenio(datos: any, cuotas: any) {
    const blob = this.buildConvenioPdfBlob(datos, cuotas);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  buildConvenioPdfBlob(datos: any, cuotas: any): Blob {
    const doc = new jsPDF('p', 'pt', 'a4');
    const detalle = (Array.isArray(cuotas) ? cuotas : []).map((cuota: any) => {
      const montos = this.calcularMontosCuota(cuota);
      const capital = Math.round(montos.capital * 100);
      const interes = Math.round(montos.interes * 100);
      return { cuota, capital, interes, total: capital + interes };
    });
    const capitalTotal = detalle.reduce((sum, item) => sum + item.capital, 0);
    const interesTotal = detalle.reduce((sum, item) => sum + item.interes, 0);
    const totalConInteres = detalle.length
      ? (capitalTotal + interesTotal) / 100
      : Number(datos.totalconvenio ?? 0);
    const importe = (centavos: number) => (centavos / 100).toFixed(2);
    const meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    const administradores = [
      { nombre: 'Ing. Juan Diego Delgado', cargo: 'Director Comercial' },
      { nombre: 'Ab. Rigoberto Narvaez', cargo: 'Jefe de coactivas' },
    ];

    this.header.header(`MODULO: AGUA Y ALCANTARILLADO N° ${datos.nroconvenio}`, doc);

    const empresa =
      'Empresa Pública Municipal de Agua Potable y Alcantarillado de Tulcán';
    const fecha = new Date(datos.feccrea);
    const cuotasTabla: any[] = [];

    const p1 = `En la ciudad de Tulcán, a los ${fecha.getDate()} dias del mes ${
      meses[fecha.getMonth()]
    } del año ${fecha.getFullYear()}, comparecen, por una parte el ${
      administradores[0].nombre
    } en calidad de ${administradores[0].cargo}, el ${
      administradores[1].nombre
    } como ${administradores[1].cargo} de la ${empresa}, y por otra parte el(la) Sr.(a) ${
      datos.nomcli
    } en su calidad de solicitante, las partes en forma libre y voluntaria, convienen en suscribir el presente convenio, al tenor de las cláusulas siguientes: `;
    const p2 = 'PRIMERA.- ANTECEDENTES:';
    const p3 = `1.- El deudor posee una deuda por Titulo(s) de AGUA Y ALCANTARILLADO a nombre de la ${empresa}, de referencia Nro.: ${datos.referencia}. El deudor por el momento no cuenta con los recursos económicos necesarios para cancelar los valores adeudados.`;
    const p4 = `2.- Mediante autorización, el (la) ${administradores[0].nombre} ${administradores[0].cargo} autoriza se realice el correspondiente convenio de pago en un plazo de ${cuotas.length} meses.`;
    const p5 = 'SEGUNDA.- OBJETO:';
    const p6 = `El(la) deudor se compromete a cancelar a la ${empresa} el valor adeudado, que en total es de $${Number(
      totalConInteres
    ).toFixed(2)}, de acuerdo a la fórmula de pago determinada en la cláusula siguiente: por título(s) pendiente(s) de pago a la ${empresa}.`;
    const p7 = 'TERCERA.- FORMA DE PAGO: ';
    const p8 =
      'El(la) solicitante depositará en la ventanilla de recaudación el pago de acuerdo a la tabla que se adjunta al presente convenio:';
    const p9 = `Siendo un total de $${Number(totalConInteres).toFixed(
      2
    )}, a partir de la fecha de suscripción de este convenio hasta su terminación en el lapso de ${
      cuotas.length
    } meses, más la carta marcada en el transcurso del año.`;
    const p10 = 'CUARTA.- SANCIÓN: ';
    const p11 =
      'En caso de que el(la) deudor(a) no cancel los valores pactados en la fecha establecida, se indicará y/o continuará el juicio de coactivas en su contra, sin lugar a prorroga o plazo alguno.';
    const p12 =
      'Para constancia de lo estipulado en las cláusulas anteriores, las partes se afirman y ratifican en cada una de ellas, por lo que libre y voluntariamente firman el presente convenio.';

    detalle.forEach(({ cuota, capital, interes, total }) => {
      cuotasTabla.push([
        cuota.nrocuota,
        importe(capital),
        importe(interes),
        importe(total),
        this.formatFecha(cuota?.idfactura?.feccrea),
      ]);
    });

    autoTable(doc, {
      bodyStyles: { halign: 'justify' },
      body: [[p1], [p2], [p3], [p4], [p5], [p6], [p7], [p8]],
    });

    autoTable(doc, {
      headStyles: { halign: 'center' },
      head: [['N° cuota', 'Capital', 'Interés', 'Total a pagar', 'Fechas de pago']],
      bodyStyles: { halign: 'right' },
      body: cuotasTabla,
      foot: [['Totales', importe(capitalTotal), importe(interesTotal), totalConInteres.toFixed(2), '']],
      footStyles: { halign: 'right' },
    });

    autoTable(doc, {
      bodyStyles: { halign: 'justify' },
      body: [[p9], [p10], [p11], [p12]],
    });

    autoTable(doc, {
      bodyStyles: { halign: 'justify' },
      body: [
        [administradores[0].nombre, administradores[1].nombre, datos.nomcli],
        [administradores[0].cargo, administradores[1].cargo, 'CI:_________________'],
      ],
    });

    return doc.output('blob');
  }

  calcularMontosCuota(cuota: any): { capital: number; interes: number; total: number } {
    if (!Array.isArray(cuota?.rubros)) {
      throw new Error('No se pueden calcular los valores del convenio sin los rubros de la factura.');
    }
    let capital = 0;
    let consolidado = 0;
    for (const rubro of cuota.rubros) {
      if (rubro.estado != null && Number(rubro.estado) === 0) continue;
      const importe = this.centavosHaciaArriba(rubro.valorunitario ?? 0, rubro.cantidad ?? 1);
      const idrubro = Number(rubro.idrubro_rubros?.idrubro ?? rubro.idrubro_rubros ?? rubro.idrubro);
      if (idrubro === 5) consolidado += importe;
      else capital += importe;
    }
    const factura = cuota.idfactura ?? {};
    const pagada = Number(factura.pagado) === 1 || factura.pagado === true || !!factura.fechacobro;
    // El interes cobrado ya incluye el consolidado: no volver a sumar el rubro 5.
    const interes = pagada
      ? Math.max(0, this.centavosHaciaArriba(factura.interescobrado ?? consolidado / 100))
      : consolidado + Math.max(0, this.centavosHaciaArriba(cuota.interesMora ?? 0));
    return { capital: capital / 100, interes: interes / 100, total: (capital + interes) / 100 };
  }

  // Equivale a BigDecimal.setScale(2, UP), sin multiplicar decimales binarios.
  private centavosHaciaArriba(valor: any, cantidad: any = 1): number {
    const decimal = (value: any): { entero: bigint; escala: number } => {
      const match = String(value).trim().match(/^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
      if (!match) throw new Error('Importe de rubro no valido.');
      const fraccion = match[3] ?? '';
      return {
        entero: BigInt((match[1] === '-' ? '-' : '') + match[2] + fraccion),
        escala: fraccion.length - Number(match[4] ?? 0),
      };
    };
    const precio = decimal(valor);
    const unidades = decimal(cantidad);
    const producto = precio.entero * unidades.entero;
    const escala = precio.escala + unidades.escala - 2;
    if (escala <= 0) return Number(producto * 10n ** BigInt(-escala));
    const divisor = 10n ** BigInt(escala);
    const centavos = producto / divisor;
    const ajuste = producto % divisor === 0n ? 0n : producto < 0n ? -1n : 1n;
    return Number(centavos + ajuste);
  }

  private formatFecha(value: any): string {
    const fecha = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(fecha.getTime())) return '';
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }
}
