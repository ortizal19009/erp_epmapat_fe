import { linkedUserState } from './personal-user-state';
import { PersonalComponent } from '../personal/personal.component';

describe('Acciones según usuario vinculado', () => {
  let component: PersonalComponent;
  let personalService: any;
  beforeEach(() => {
    personalService = jasmine.createSpyObj('PersonalService',['crearUsuarioSistema','resetearPassword']);
    component = new PersonalComponent(personalService, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
  });
  it('sin cuenta ofrece crear y oculta resetear', () => {
    const labels = component.accionesDisponibles({tieneUsuario:false}).map(a => a.label);
    expect(labels).toContain('Crear usuario'); expect(labels).not.toContain('Resetear contraseña');
  });
  it('con cuenta ofrece resetear y oculta crear', () => {
    const labels = component.accionesDisponibles({tieneUsuario:true}).map(a => a.label);
    expect(labels).not.toContain('Crear usuario'); expect(labels).toContain('Resetear contraseña');
  });
  it('sin información no supone que deba crearse una cuenta', () => {
    expect(linkedUserState({usuarioSistema:'un nombre'})).toBeNull();
    const labels = component.accionesDisponibles({}).map(a => a.label);
    expect(labels).not.toContain('Crear usuario'); expect(labels).not.toContain('Resetear contraseña');
  });
  it('también bloquea invocaciones incompatibles aunque se llamen directamente', () => {
    component.accionRapida({idpersonal:7,tieneUsuario:true},'Crear usuario');
    component.accionRapida({idpersonal:7,tieneUsuario:false},'Resetear contraseña');
    expect(personalService.crearUsuarioSistema).not.toHaveBeenCalled(); expect(personalService.resetearPassword).not.toHaveBeenCalled();
  });
});
