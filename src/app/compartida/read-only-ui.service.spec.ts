import { ReadOnlyUiService } from './read-only-ui.service';

describe('Read-only report buttons', () => {
  it('keeps report acceptance enabled while disabling business changes', () => {
    const host = document.createElement('div');
    host.innerHTML = '<button data-allow-readonly>Aceptar</button><button>Guardar</button>';
    document.body.appendChild(host);
    try {
      const service = new ReadOnlyUiService(document, {} as any, {} as any, {} as any, {} as any);
      (service as any).readOnly = true; (service as any).apply();
      const buttons = host.querySelectorAll('button');
      expect(buttons[0].disabled).toBeFalse(); expect(buttons[1].disabled).toBeTrue();
    } finally { host.remove(); }
  });
  it('preserves component validation on an allowed report button', () => {
    const host = document.createElement('div');
    host.innerHTML = '<button data-allow-readonly disabled>Aceptar</button>';
    document.body.appendChild(host);
    try {
      const service = new ReadOnlyUiService(document, {} as any, {} as any, {} as any, {} as any);
      (service as any).readOnly = true; (service as any).apply();
      expect(host.querySelector('button')!.disabled).toBeTrue();
    } finally { host.remove(); }
  });
});
