import { AfterViewInit, Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: 'form, input, textarea'
})
export class DisableAutocompleteDirective implements AfterViewInit {
  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit(): void {
    const element = this.el.nativeElement;
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'form') {
      this.renderer.setAttribute(element, 'autocomplete', 'off');
      return;
    }

    this.renderer.setAttribute(element, 'autocomplete', 'off');
    this.renderer.setAttribute(element, 'autocorrect', 'off');
    this.renderer.setAttribute(element, 'autocapitalize', 'off');
    this.renderer.setAttribute(element, 'spellcheck', 'false');

    if (tagName === 'input') {
      const input = element as HTMLInputElement;
      if (!input.name) {
        this.renderer.setAttribute(input, 'name', `field_${Math.random().toString(36).slice(2, 10)}`);
      }
    }
  }
}
