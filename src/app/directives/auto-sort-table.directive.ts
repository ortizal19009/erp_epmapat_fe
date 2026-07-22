import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  Renderer2,
} from '@angular/core';
import { Router } from '@angular/router';

type SortDirection = 'asc' | 'desc';

@Directive({
  selector: 'table.table',
})
export class AutoSortTableDirective implements AfterViewInit, OnDestroy {
  private cleanupFns: Array<() => void> = [];
  private activeColumnIndex = -1;
  private activeDirection: SortDirection = 'asc';
  private initialized = false;

  constructor(
    private el: ElementRef<HTMLTableElement>,
    private renderer: Renderer2,
    private router: Router
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeSorting());
  }

  ngOnDestroy(): void {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
  }

  private initializeSorting(): void {
    if (this.initialized || this.shouldSkipTable()) {
      return;
    }

    const headers = Array.from(
      this.el.nativeElement.querySelectorAll('thead th')
    ) as HTMLTableCellElement[];
    if (!headers.length || this.hasCustomSorting(headers)) {
      return;
    }

    headers.forEach((header, index) => {
      const label = (header.textContent || '').trim();
      if (!label) {
        return;
      }

      this.renderer.setStyle(header, 'cursor', 'pointer');
      this.renderer.setStyle(header, 'user-select', 'none');

      const icon = this.renderer.createElement('i');
      this.renderer.addClass(icon, 'bi');
      this.renderer.addClass(icon, 'ml-1');
      this.renderer.setStyle(icon, 'font-size', '0.85em');
      this.renderer.setStyle(icon, 'visibility', 'hidden');
      this.renderer.appendChild(header, icon);

      const unlisten = this.renderer.listen(header, 'click', () => {
        const direction: SortDirection =
          this.activeColumnIndex === index && this.activeDirection === 'asc'
            ? 'desc'
            : 'asc';
        this.sortTable(index, direction, headers);
      });

      this.cleanupFns.push(unlisten);
    });

    this.initialized = true;
  }

  private shouldSkipTable(): boolean {
    const url = this.router.url || '';
    if (url.includes('/recaudacion') || url.includes('/add-recauda')) {
      return true;
    }

    const table = this.el.nativeElement;
    return table.hasAttribute('data-disable-auto-sort');
  }

  private hasCustomSorting(headers: HTMLTableCellElement[]): boolean {
    return headers.some((header) => {
      const className = header.className || '';
      const icon = header.querySelector('.bi-sort-up, .bi-sort-down, .bi-arrow-down-up');
      const text = (header.textContent || '').trim();
      return className.includes('sortable') || !!icon || text.includes('▲') || text.includes('▼') || text.includes('↕');
    });
  }

  private sortTable(
    columnIndex: number,
    direction: SortDirection,
    headers: HTMLTableCellElement[]
  ): void {
    const tbody = this.el.nativeElement.tBodies?.[0];
    if (!tbody) {
      return;
    }

    const rows = Array.from(tbody.rows);
    const sortableRows = rows.filter((row) => !this.isSummaryRow(row));
    const fixedRows = rows.filter((row) => this.isSummaryRow(row));

    sortableRows.sort((a, b) =>
      this.compareValues(
        this.getCellValue(a, columnIndex),
        this.getCellValue(b, columnIndex),
        direction
      )
    );

    [...sortableRows, ...fixedRows].forEach((row) => this.renderer.appendChild(tbody, row));

    this.activeColumnIndex = columnIndex;
    this.activeDirection = direction;
    this.updateIcons(headers);
  }

  private updateIcons(headers: HTMLTableCellElement[]): void {
    headers.forEach((header, index) => {
      const icon = header.querySelector('i.bi');
      if (!icon) {
        return;
      }

      this.renderer.removeClass(icon, 'bi-sort-up');
      this.renderer.removeClass(icon, 'bi-sort-down');
      this.renderer.setStyle(icon, 'visibility', index === this.activeColumnIndex ? 'visible' : 'hidden');

      if (index === this.activeColumnIndex) {
        this.renderer.addClass(icon, this.activeDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down');
      }
    });
  }

  private isSummaryRow(row: HTMLTableRowElement): boolean {
    return Array.from(row.cells).some((cell) => {
      const colspan = Number(cell.getAttribute('colspan') || 0);
      if (colspan > 1) {
        return true;
      }
      const text = (cell.textContent || '').trim().toUpperCase();
      return text.startsWith('TOTAL');
    });
  }

  private getCellValue(row: HTMLTableRowElement, columnIndex: number): string {
    const cell = row.cells.item(columnIndex);
    return (cell?.textContent || '').trim();
  }

  private compareValues(a: string, b: string, direction: SortDirection): number {
    const factor = direction === 'asc' ? 1 : -1;
    const av = this.parseValue(a);
    const bv = this.parseValue(b);

    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * factor;
    }

    if (av instanceof Date && bv instanceof Date) {
      return (av.getTime() - bv.getTime()) * factor;
    }

    return `${av}`.localeCompare(`${bv}`, 'es', { numeric: true, sensitivity: 'base' }) * factor;
  }

  private parseValue(value: string): string | number | Date {
    const trimmed = value.replace(/\s+/g, ' ').trim();
    if (!trimmed) {
      return '';
    }

    const numberCandidate = trimmed.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    if (/^-?\d+(\.\d+)?$/.test(numberCandidate)) {
      const parsedNumber = Number(numberCandidate);
      if (!Number.isNaN(parsedNumber)) {
        return parsedNumber;
      }
    }

    const dateMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (dateMatch) {
      const day = Number(dateMatch[1]);
      const month = Number(dateMatch[2]) - 1;
      const year = Number(dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3]);
      return new Date(year, month, day);
    }

    return trimmed.toLowerCase();
  }
}
