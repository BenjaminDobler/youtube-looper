import { Component, ViewEncapsulation, signal, Input, Output, EventEmitter } from '@angular/core';
import { Loop } from '../models/loop.model';
import { IconComponent } from '../shared/icon.component';
import { LoopsTabComponent } from './loops-tab.component';
import { LibraryTabComponent } from './library-tab.component';

type TabType = 'loops' | 'library';

@Component({
  selector: 'youtube-loop-sidebar',
  standalone: true,
  imports: [IconComponent, LoopsTabComponent, LibraryTabComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class SidebarComponent {
  // Traditional inputs for Angular Elements compatibility
  @Input() set loops(value: Loop[]) { this._loops.set(value); }
  get loops() { return this._loops(); }
  
  @Input() set activeLoopId(value: string | null) { this._activeLoopId.set(value); }
  get activeLoopId() { return this._activeLoopId(); }
  
  @Input() set pitchShift(value: number) { this._pitchShift.set(value); }
  get pitchShift() { return this._pitchShift(); }

  // Internal signals
  protected _loops = signal<Loop[]>([]);
  protected _activeLoopId = signal<string | null>(null);
  protected _pitchShift = signal<number>(0);
  
  // Tab state
  protected activeTab = signal<TabType>('loops');

  // Traditional outputs
  @Output() loopActivated = new EventEmitter<{ loopId: string }>();
  @Output() loopDeactivated = new EventEmitter<void>();
  @Output() loopDeleted = new EventEmitter<{ loopId: string }>();
  @Output() loopUpdated = new EventEmitter<{ loop: Loop }>();
  @Output() getCurrentTime = new EventEmitter<{ callback: (time: number) => void }>();
  @Output() pitchChanged = new EventEmitter<{ semitones: number }>();
  
  // Switch tabs
  onTabChange(tab: TabType) {
    this.activeTab.set(tab);
  }
}
