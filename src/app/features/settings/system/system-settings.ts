import { CommonModule } from '@angular/common';
import { InfoHelpComponent } from '../../../shared/help/info-help';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SystemSettingsApi } from '../../../core/api/system-settings-api';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoHelpComponent],
  templateUrl: './system-settings.html',
  styleUrls: ['./system-settings.css'],
})
export class SystemSettingsComponent implements OnInit {
  rows: any[] = [];
  loading = false;
  error: string | null = null;

  model: any = {
    sla_hours_default: '48',
    alerts_channel_default: 'TELEGRAM',
    entity_display_name: 'EPMAPA-T',
    workdays_policy: 'LUN-VIE',
  };

  constructor(private api: SystemSettingsApi) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.list(ENTITY_CODE).subscribe({
      next: (rows) => {
        this.rows = rows || [];
        for (const r of this.rows) this.model[r.setting_key] = r.setting_value;
      },
      error: (e) => this.error = e?.error?.detail || e?.message || 'Error cargando configuración',
      complete: () => this.loading = false,
    });
  }

  save(): void {
    const entries = Object.entries(this.model);
    const next = (i: number) => {
      if (i >= entries.length) { alert('Configuración guardada'); this.load(); return; }
      const [k, v] = entries[i] as [string, any];
      this.api.upsert(ENTITY_CODE, k, String(v ?? '')).subscribe({
        next: () => next(i + 1),
        error: (e) => this.error = e?.error?.detail || e?.message || 'Error guardando configuración',
      });
    };
    next(0);
  }
}


