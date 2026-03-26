import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { HELP_CONTENT } from './help-content';

@Component({
  selector: 'app-info-help',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-help.html',
  styleUrls: ['./info-help.css']
})
export class InfoHelpComponent {
  @Input() key = '';
  open = false;

  get item() { return HELP_CONTENT[this.key]; }
}

