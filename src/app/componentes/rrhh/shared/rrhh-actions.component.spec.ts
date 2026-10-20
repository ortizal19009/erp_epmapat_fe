import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RrhhActionsComponent } from './rrhh-actions.component';

@Component({template:`<div style="height:45px;overflow:auto"><table><tbody><tr><td>
  <app-rrhh-actions label="Acciones de Ana" [disabled]="busy">
    <button type="button" class="dropdown-item" (click)="selected='detalle'">Detalle</button>
    <button *ngIf="write" type="button" class="dropdown-item" (click)="selected='aprobar'">Aprobar</button>
    <button type="button" class="dropdown-item" disabled (click)="selected='bloqueado'">Bloqueado</button>
  </app-rrhh-actions></td></tr></tbody></table></div>`})
class Host { write=false; busy=false; selected=''; }

describe('Menú de acciones RRHH', () => {
  beforeEach(() => TestBed.configureTestingModule({imports:[CommonModule,RrhhActionsComponent],declarations:[Host]}));
  function setup() {
    const fixture=TestBed.createComponent(Host); fixture.detectChanges();
    const trigger=fixture.nativeElement.querySelector('.rrhh-actions-trigger') as HTMLButtonElement;
    return {fixture,trigger};
  }
  it('abre las opciones permitidas y ejecuta una sola accion al elegir', fakeAsync(() => {
    const {fixture,trigger}=setup(); trigger.click(); fixture.detectChanges(); tick(); fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const buttons=fixture.nativeElement.querySelectorAll('.rrhh-actions-menu button');
    expect(buttons.length).toBe(2); expect(buttons[1].disabled).toBeTrue();
    buttons[0].click(); fixture.detectChanges();
    expect(fixture.componentInstance.selected).toBe('detalle');
    expect(fixture.nativeElement.querySelector('.rrhh-actions-menu')).toBeNull();
    expect(document.activeElement).toBe(trigger); fixture.destroy();
  }));
  it('conserva el permiso de escritura y los estados bloqueados', fakeAsync(() => {
    const {fixture,trigger}=setup(); fixture.componentInstance.write=true; fixture.detectChanges();
    trigger.click(); fixture.detectChanges(); tick(); fixture.detectChanges();
    const buttons=fixture.nativeElement.querySelectorAll('.rrhh-actions-menu button');
    expect(buttons.length).toBe(3);
    buttons[2].click(); fixture.detectChanges();
    expect(fixture.componentInstance.selected).toBe('');
    buttons[1].click(); fixture.detectChanges();
    expect(fixture.componentInstance.selected).toBe('aprobar'); fixture.destroy();
  }));
  it('navega con teclado, omite deshabilitados y cierra con Escape', fakeAsync(() => {
    const {fixture,trigger}=setup(); fixture.componentInstance.write=true; fixture.detectChanges();
    trigger.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
    fixture.detectChanges(); tick(); fixture.detectChanges();
    const buttons=fixture.nativeElement.querySelectorAll('.rrhh-actions-menu button');
    expect(document.activeElement).toBe(buttons[0]);
    buttons[0].dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
    expect(document.activeElement).toBe(buttons[1]);
    buttons[1].dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); fixture.detectChanges();
    expect(document.activeElement).toBe(trigger); expect(trigger.getAttribute('aria-expanded')).toBe('false'); fixture.destroy();
  }));
  it('posiciona el menu dentro de la pantalla aunque la tabla tenga scroll', fakeAsync(() => {
    const {fixture,trigger}=setup();
    spyOn(trigger,'getBoundingClientRect').and.returnValue({top:window.innerHeight-40,bottom:window.innerHeight-8,right:window.innerWidth-8,left:window.innerWidth-100} as DOMRect);
    trigger.click(); fixture.detectChanges();
    const menu=fixture.nativeElement.querySelector('.rrhh-actions-menu') as HTMLElement;
    spyOn(menu,'getBoundingClientRect').and.returnValue({width:250,height:200} as DOMRect);
    tick(); fixture.detectChanges();
    expect(getComputedStyle(menu).position).toBe('fixed');
    expect(parseFloat(menu.style.top)).toBeLessThan(window.innerHeight-200);
    expect(parseFloat(menu.style.left)).toBeGreaterThanOrEqual(8);
    document.body.click(); fixture.detectChanges(); expect(fixture.nativeElement.querySelector('.rrhh-actions-menu')).toBeNull(); fixture.destroy();
  }));
  it('no abre durante guardado y cierra al desplazar el contenedor', fakeAsync(() => {
    const {fixture,trigger}=setup(); fixture.componentInstance.busy=true; fixture.detectChanges(); trigger.click();
    fixture.detectChanges(); expect(fixture.nativeElement.querySelector('.rrhh-actions-menu')).toBeNull();
    fixture.componentInstance.busy=false; fixture.detectChanges(); trigger.click(); fixture.detectChanges(); tick(); fixture.detectChanges();
    fixture.nativeElement.querySelector('div').dispatchEvent(new Event('scroll')); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.rrhh-actions-menu')).toBeNull(); fixture.destroy();
  }));
});
