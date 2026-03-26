import { CommonModule } from '@angular/common';
import { InfoHelpComponent } from '../../../shared/help/info-help';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CcdApi } from '../../../core/api/ccd-api';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  selector: 'app-ccd-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoHelpComponent],
  templateUrl: './ccd-settings.html',
  styleUrls: ['./ccd-settings.css'],
})
export class CcdSettingsComponent implements OnInit {
  series: any[] = [];
  subseries: any[] = [];
  selectedSeriesId = '';
  code = '';
  name = '';
  subCode = '';
  subName = '';

  constructor(private api: CcdApi) {}

  ngOnInit(): void { this.loadSeries(); }

  loadSeries(): void {
    this.api.listSeries(ENTITY_CODE).subscribe({ next: (r) => this.series = r || [] });
  }

  selectSeries(id: string): void {
    this.selectedSeriesId = id;
    if (!id) { this.subseries = []; return; }
    this.api.listSubseries(id).subscribe({ next: (r) => this.subseries = r || [] });
  }

  createSeries(): void {
    if (!this.code || !this.name) return;
    this.api.createSeries(ENTITY_CODE, this.code, this.name).subscribe({
      next: () => { this.code=''; this.name=''; this.loadSeries(); }
    });
  }

  createSubseries(): void {
    if (!this.selectedSeriesId || !this.subCode || !this.subName) return;
    this.api.createSubseries(this.selectedSeriesId, this.subCode, this.subName).subscribe({
      next: () => { this.subCode=''; this.subName=''; this.selectSeries(this.selectedSeriesId); }
    });
  }
}



