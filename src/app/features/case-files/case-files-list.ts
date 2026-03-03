import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InfoHelpComponent } from '../../shared/help/info-help';
import { DependencyApi } from '../../core/api/dependency-api';
import { CaseFilesApi } from '../../core/api/case-files-api';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  selector: 'app-case-files-list',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoHelpComponent],
  templateUrl: './case-files-list.html',
  styleUrls: ['./case-files-list.css'],
})
export class CaseFilesListComponent implements OnInit {
  rows: any[] = [];
  deps: any[] = [];
  code = '';
  title = '';
  ownerDependencyId: string | null = null;
  selectedCaseItems: any[] = [];
  selectedCaseId = '';
  selectedCaseStatus = '';

  constructor(private api: CaseFilesApi, private depsApi: DependencyApi) {}

  ngOnInit(): void {
    this.load();
    this.depsApi.list(ENTITY_CODE).subscribe({ next: (r: any) => this.deps = r || [] });
  }

  load(): void {
    this.api.list(ENTITY_CODE).subscribe({ next: (r: any) => this.rows = r || [] });
  }

  create(): void {
    if (!this.code || !this.title) return;
    this.api.create(ENTITY_CODE, { code: this.code, title: this.title, owner_dependency_id: this.ownerDependencyId }).subscribe({
      next: () => { this.code=''; this.title=''; this.ownerDependencyId=null; this.load(); }
    });
  }

  close(row: any): void {
    if (!confirm('¿Cerrar expediente?')) return;
    this.api.close(row.id).subscribe({ next: () => this.load() });
  }

  viewItems(row: any): void {
    this.selectedCaseId = row.id;
    this.selectedCaseStatus = row.status;
    this.api.items(row.id).subscribe({ next: (r: any) => this.selectedCaseItems = r || [] });
  }
}

