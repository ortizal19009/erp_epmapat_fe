import { convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { InfoPersonalComponent } from './info-personal.component';
describe('Accesos de la ficha del empleado', () => {
  let router: any;
  let component: InfoPersonalComponent;
  let personalService: any;
  beforeEach(() => {
    router = jasmine.createSpyObj('Router',['navigate']);
    personalService = jasmine.createSpyObj('PersonalService', ['crearUsuarioSistema', 'resetearPassword']);
    personalService.crearUsuarioSistema.and.returnValue(of({}));
    personalService.resetearPassword.and.returnValue(of({}));
    component = new InfoPersonalComponent(router, personalService, {} as any, {} as any, {} as any, {} as any, {} as any,
      { snapshot: {queryParamMap: convertToParamMap({idpersonal:'7'})}} as any, {} as any);
    spyOn(component,'loadDashboard');
  });
  afterEach(() => sessionStorage.removeItem('idpersonalToInfo'));
  it('abre las tres gestiones con el empleado de la ficha', () => {
    component.ngOnInit();
    for (const route of ['th-leave','th-files','th-performance'] as const) {
      component.abrirGestion(route);
      expect(router.navigate).toHaveBeenCalledWith([`/${route}`], {queryParams:{idpersonal:7}});
    }
    expect(sessionStorage.getItem('idpersonalToInfo')).toBe('7');
  });
  it('no abre gestiones sin un empleado válido', () => {
    component.personalId = 0; component.abrirGestion('th-leave'); expect(router.navigate).not.toHaveBeenCalled();
  });
  it('bloquea crear y resetear fuera de la pestaña Usuario', () => {
    component.personalId = 7;
    for (const tab of ['resumen', 'vacaciones', 'documentos', 'evaluacion', 'historial']) {
      component.activeTab = tab;
      component.personal = { tieneUsuario: false }; component.crearUsuario();
      component.personal = { tieneUsuario: true }; component.resetPassword();
    }
    expect(personalService.crearUsuarioSistema).not.toHaveBeenCalled();
    expect(personalService.resetearPassword).not.toHaveBeenCalled();
  });
  it('en Usuario permite únicamente la acción compatible con el vínculo', () => {
    spyOn(window, 'alert');
    component.personalId = 7; component.activeTab = 'usuario';
    component.personal = { tieneUsuario: false };
    component.resetPassword(); component.crearUsuario();
    expect(personalService.crearUsuarioSistema).toHaveBeenCalledOnceWith(7);
    expect(personalService.resetearPassword).not.toHaveBeenCalled();
    component.personal = { tieneUsuario: true };
    component.crearUsuario(); component.resetPassword();
    expect(personalService.crearUsuarioSistema).toHaveBeenCalledTimes(1);
    expect(personalService.resetearPassword).toHaveBeenCalledOnceWith(7);
  });
  it('no ejecuta acciones sin empleado o sin información de la cuenta', () => {
    component.activeTab = 'usuario'; component.personalId = 7; component.personal = {};
    component.crearUsuario(); component.resetPassword();
    component.personalId = 0;
    component.personal = { tieneUsuario: false }; component.crearUsuario();
    component.personal = { tieneUsuario: true }; component.resetPassword();
    expect(personalService.crearUsuarioSistema).not.toHaveBeenCalled();
    expect(personalService.resetearPassword).not.toHaveBeenCalled();
  });
});
