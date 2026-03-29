export type SectionTone = string;

export interface SectionSummaryCard {
  label: string;
  value: string;
  help: string;
  tone: SectionTone;
  icon: string;
}

export interface SectionAlert {
  tone: string;
  title: string;
  message: string;
}

export interface SectionFilterOption {
  value: string;
  label: string;
}

export interface SectionFilter {
  label: string;
  value: string;
  options: SectionFilterOption[];
}

export interface SectionColumn {
  key: string;
  label: string;
}

export interface SectionHighlight {
  title: string;
  value: string;
  help: string;
}

export abstract class RrhhSectionPageBase {
  title = '';
  subtitle = '';
  sectionName = '';
  pageIcon = 'bi bi-grid-1x2-fill';
  tableTitle = '';
  tableSubtitle = '';
  highlightTitle = 'Prioridades';

  summaryCards: SectionSummaryCard[] = [];
  alerts: SectionAlert[] = [];
  filters: SectionFilter[] = [];
  highlights: SectionHighlight[] = [];
  tableColumns: SectionColumn[] = [];
  tableRows: any[] = [];

  trackByLabel(_: number, item: { label?: string; title?: string }): string {
    return item.label || item.title || `${_}`;
  }

  cell(row: any, key: string): string {
    const value = row?.[key];
    return value === null || value === undefined || value === '' ? '-' : String(value);
  }
}

