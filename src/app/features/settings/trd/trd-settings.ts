import { CommonModule } from '@angular/common';
import { InfoHelpComponent } from '../../../shared/help/info-help';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrdApi } from '../../../core/api/trd-api';
import { CcdApi } from '../../../core/api/ccd-api';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  selector: 'app-trd-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoHelpComponent],
  templateUrl: './trd-settings.html',
  styleUrls: ['./trd-settings.css'],
})
export class TrdSettingsComponent implements OnInit {
  rows: any[] = [];
  series: any[] = [];
  subseries: any[] = [];
  model: any = { series_id: '', subseries_id: '', active_years: 1, semi_active_years: 1, final_disposition: 'CONSERVAR', legal_basis: '' };

  constructor(private api: TrdApi, private ccdApi: CcdApi) {}

  ngOnInit(): void { this.load(); this.loadSeries(); }

  load(): void { this.api.list(ENTITY_CODE).subscribe({ next: (r) => this.rows = r || [] }); }
  loadSeries(): void { this.ccdApi.listSeries(ENTITY_CODE).subscribe({ next: (r) => this.series = r || [] }); }
  onSeriesChange(): void {
    this.model.subseries_id = '';
    if (!this.model.series_id) { this.subseries = []; return; }
    this.ccdApi.listSubseries(this.model.series_id).subscribe({ next: (r) => this.subseries = r || [] });
  }
  save(): void {
    if (!this.model.series_id) return;
    this.api.upsert(ENTITY_CODE, this.model).subscribe({ next: () => this.load() });
  }
}


