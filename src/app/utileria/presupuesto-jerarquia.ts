import { ColumnasPresupuesto, totalesPresupuesto } from './presupuesto-columnas';

/** Agrupa exclusivamente detalles: nunca vuelve a sumar subtotales. */
export function jerarquiaPresupuesto(detalles: any[], tipo: 1 | 2, clasificador: any[], funciones: any[] = []): any[] {
  const grupos = new Map<string, { nombre: string; detalles: any[] }>();
  const agregar = (codigo: string, nombre: string, detalle: any) => {
    if (codigo === detalle.codpar) return;
    if (!grupos.has(codigo)) grupos.set(codigo, { nombre, detalles: [] });
    const grupo = grupos.get(codigo)!;
    if (!grupo.detalles.includes(detalle)) grupo.detalles.push(detalle);
  };
  const esPrefijo = (codigo: string, padre: string) => codigo.startsWith(padre + '.') || (padre.length === 1 && codigo.startsWith(padre));
  for (const detalle of detalles) {
    const codigo = String(detalle.codpar).trim();
    const punto = codigo.indexOf('.');
    const funcion = tipo === 2 ? codigo.slice(0, punto) : '';
    const partida = tipo === 2 ? codigo.slice(punto + 1) : codigo;
    if (tipo === 2) agregar(funcion, funciones.find(f => String(f.codigo).trim() === funcion)?.nombre || funcion, detalle);
    // Algunos niveles intermedios no tienen ficha propia en el clasificador.
    // Se conserva el prefijo y la denominacion del detalle que lo origina.
    const segmentos = partida.split('.');
    for (let nivel = 1; nivel < segmentos.length; nivel++) {
      const padre = segmentos.slice(0, nivel).join('.');
      const nombre = clasificador.find(c => String(c.codpar).trim() === padre)?.nompar || detalle.nompar;
      agregar(tipo === 2 ? funcion + '.' + padre : padre, nombre, detalle);
    }
    for (const c of clasificador) {
      const padre = String(c.codpar).trim();
      if (padre && esPrefijo(partida, padre)) agregar(tipo === 2 ? funcion + '.' + padre : padre, c.nompar, detalle);
    }
  }
  const filas: any[] = detalles.map(d => ({ ...d, agrupadora: false }));
  for (const [codpar, grupo] of grupos) {
    filas.push({ codpar, nompar: grupo.nombre, agrupadora: true, ...totalesPresupuesto(grupo.detalles as ColumnasPresupuesto[]) });
  }
  return filas.sort((a, b) => String(a.codpar).localeCompare(String(b.codpar)));
}
