import { Component, ViewEncapsulation, signal, input, output, ChangeDetectionStrategy, effect, ElementRef } from '@angular/core';
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
  
  // UI visibility state
  protected isUIVisible = signal<boolean>(true);

  constructor(private elementRef: ElementRef) {
    // Make setUIVisible method accessible from outside
    (this.elementRef.nativeElement as any).setUIVisible = (visible: boolean) => {
      this.isUIVisible.set(visible);
    };
    
    // Load initial visibility state from localStorage
    try {
      const saved = localStorage.getItem('yt-looper-ui-visible');
      const visible = saved !== 'false'; // Default to true
      this.isUIVisible.set(visible);
      console.log('Sidebar: Loaded initial UI visibility from localStorage:', visible);
      
      // Apply initial state to timeline after a delay to ensure it exists
      setTimeout(() => {
        const timelineContainer = document.getElementById('yt-looper-timeline-container');
        if (timelineContainer) {
          timelineContainer.style.setProperty('display', visible ? 'block' : 'none', 'important');
          console.log('Sidebar: Applied initial timeline visibility on load:', visible ? 'block' : 'none');
        } else {
          console.warn('Sidebar: Timeline container not found on initial load');
        }
      }, 200);
    } catch (e) {
      console.error('Failed to load visibility preference:', e);
    }
  }

  // Switch tabs
  onTabChange(tab: TabType) {
    this.activeTab.set(tab);
  }

  // Toggle UI visibility
  onToggleUIVisibility() {
    const newValue = !this.isUIVisible();
    console.log('Sidebar: Toggle button clicked, new visibility:', newValue);
    this.isUIVisible.set(newValue);
    
    // Directly hide/show timeline (both in MAIN world, so direct DOM access works)
    const timelineContainer = document.getElementById('yt-looper-timeline-container');
    if (timelineContainer) {
      timelineContainer.style.setProperty('display', newValue ? 'block' : 'none', 'important');
      console.log('Sidebar: Set timeline display to:', newValue ? 'block' : 'none');
    } else {
      console.warn('Sidebar: Timeline container not found');
    }
    
    // Save preference to localStorage for persistence
    try {
      localStorage.setItem('yt-looper-ui-visible', String(newValue));
      console.log('Sidebar: Saved UI visibility preference to localStorage:', newValue);
    } catch (e) {
      console.error('Sidebar: Failed to save preference:', e);
    }
  }

  private dispatchEvent(event: CustomEvent) {
    this.elementRef.nativeElement.dispatchEvent(event);
  }
}
