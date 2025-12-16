import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<svg 
    [attr.width]="size" 
    [attr.height]="size" 
    [attr.viewBox]="viewBox"
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
    [innerHTML]="safeIconPath"
  ></svg>`,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      display: block;
    }
  `]
})
export class IconComponent {
  @Input() name: string = '';
  @Input() size: number = 16;
  @Input() viewBox: string = '0 0 24 24';

  constructor(private sanitizer: DomSanitizer) {}

  get safeIconPath(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.iconPath);
  }

  private get iconPath(): string {
    const icons: Record<string, string> = {
      'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
      'edit': '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
      'trash': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
      'check': '<path d="M20 6 9 17l-5-5"/>',
      'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
      'repeat': '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'
    };
    
    return icons[this.name] || '';
  }
}
