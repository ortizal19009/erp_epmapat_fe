/** Ausencia de información no significa ausencia de cuenta. */
export function linkedUserState(personal: any): boolean | null {
  return typeof personal?.tieneUsuario === 'boolean' ? personal.tieneUsuario : null;
}
