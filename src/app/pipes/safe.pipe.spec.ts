import { SafePipe } from './safe.pipe';
import { DomSanitizer } from '@angular/platform-browser';

describe('SafePipe', () => {
  it('create an instance', () => {
    const sanitizer = {
      bypassSecurityTrustUrl: (value: string) => value,
    } as unknown as DomSanitizer;
    const pipe = new SafePipe(sanitizer);
    expect(pipe).toBeTruthy();
  });
});
