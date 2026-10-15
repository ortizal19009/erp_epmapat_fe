/** Un enlace inválido nunca debe seleccionar silenciosamente otro empleado. */
export function personalFromContext(list: any[], requested: string | null): number {
  if (requested === null) return Number(list[0]?.idpersonal || 0);
  const id = Number(requested);
  return Number.isSafeInteger(id) && id > 0 && list.some(p => Number(p.idpersonal) === id) ? id : 0;
}
