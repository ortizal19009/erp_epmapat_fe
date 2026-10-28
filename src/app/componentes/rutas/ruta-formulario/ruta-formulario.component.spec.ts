import { convertToParamMap } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { RutaFormularioComponent } from './ruta-formulario.component';
describe('Formulario de rutas y traslados',()=>{
  let c:RutaFormularioComponent, api:any;
  beforeEach(()=>{
    api={guardar:jasmine.createSpy().and.returnValue(of({idruta:10,codigo:'DEST',descripcion:'Destino',orden:1,estado:true})),
      cuentas:jasmine.createSpy().and.returnValue(of({content:[],number:0,totalElements:0,totalPages:0}))};
    c=new RutaFormularioComponent(new FormBuilder(),null!,{navigate:()=>Promise.resolve(true)} as any,null!,api,{idusuario:7} as any);
    c.form.patchValue({codigo:'DEST',descripcion:'Destino',orden:1,estado:true,motivo:'Redistribucion'});
  });
  afterEach(()=>c.ngOnDestroy());
  it('conserva seleccion de varias rutas al cambiar de pagina y envia origen esperado',async()=>{
    c.id=10;c.seleccionar({idabonado:1,rutaorigen:20},true);c.buscar(1);c.seleccionar({idabonado:2,rutaorigen:30},true);
    await c.guardar();
    expect(api.guardar.calls.mostRecent().args).toEqual([10,{codigo:'DEST',descripcion:'Destino',orden:1,estado:true,motivo:'Redistribucion',usuario:7,cuentas:[{cuenta:1,rutaOrigen:20},{cuenta:2,rutaOrigen:30}]}]);
    expect(c.seleccionadas.size).toBe(0);expect(c.versionHistorial).toBe(1);
  });
  it('crea una ruta sin cuentas y no llama a editar una ruta existente',async()=>{
    await c.guardar();expect(api.guardar.calls.mostRecent().args[0]).toBeNull();expect(c.id).toBe(10);
  });
  it('exige motivo al trasladar y conserva seleccion ante conflicto',async()=>{
    c.id=10;c.seleccionar({idabonado:1,rutaorigen:20},true);c.form.patchValue({motivo:''});await c.guardar();
    expect(api.guardar).not.toHaveBeenCalled();expect(c.error).toContain('motivo');
    c.form.patchValue({motivo:'Reordenar'});api.guardar.and.returnValue(throwError(()=>({error:{message:'La cuenta cambio de ruta'}})));
    await c.guardar();expect(c.seleccionadas.size).toBe(1);expect(c.error).toBe('La cuenta cambio de ruta');expect(c.guardando).toBeFalse();
  });
  it('seleccionar y deseleccionar una pagina no borra cuentas elegidas en otra',()=>{
    c.seleccionar({idabonado:9,rutaorigen:20},true);c.filas=[{idabonado:1},{idabonado:2}];c.seleccionarPagina(true);
    expect(c.todasEnPagina).toBeTrue();c.seleccionarPagina(false);expect(c.cuentasSeleccionadas.map(a=>a.idabonado)).toEqual([9]);
  });
  it('completa codigo y orden con la secuencia informada por el servidor',async()=>{
    api.siguienteCodigo=()=>of({codigo:'20400173',orden:116});
    c=new RutaFormularioComponent(new FormBuilder(),{paramMap:of(convertToParamMap({})),snapshot:{routeConfig:{path:'add-rutas'}}} as any,null!,{getListaRutas:()=>of([])} as any,api,{idusuario:7} as any);
    c.ngOnInit();await Promise.resolve();await Promise.resolve();
    expect(c.form.value.codigo).toBe('20400173');expect(c.form.value.orden).toBe(116);
  });

});
