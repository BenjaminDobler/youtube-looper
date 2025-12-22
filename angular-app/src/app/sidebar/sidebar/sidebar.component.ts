import { Component, ViewEncapsulation, signal, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Loop } from '../../models/loop.model';
import { IconComponent } from '../../shared/icon.component';
import { LoopsTabComponent } from '../loops-tab/loops-tab.component';
import { LibraryTabComponent } from '../library-tab/library-tab.component';

type TabType = 'loops' | 'library';

@Component({
  selector: 'youtube-loop-sidebar',
  imports: [IconComponent, LoopsTabComponent, LibraryTabComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  // Inputs using modern signal-based API
  loops = input<Loop[]>([]);
  activeLoopId = input<string | null>(null);
  pitchShift = input<number>(0);

  // Outputs using modern signal-based API
  loopActivated = output<{ loopId: string }>();
  loopDeactivated = output<void>();
  loopDeleted = output<{ loopId: string }>();
  loopUpdated = output<{ loop: Loop }>();
  getCurrentTime = output<{ callback: (time: number) => void }>();
  pitchChanged = output<{ semitones: number }>();
  
  // Tab state
  protected activeTab = signal<TabType>('loops');

  // Switch tabs
  onTabChange(tab: TabType) {
    this.activeTab.set(tab);
  }
}
