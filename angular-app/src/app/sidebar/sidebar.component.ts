import { Component, ViewEncapsulation, signal, computed, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Loop } from '../models/loop.model';
import { IconComponent } from '../shared/icon.component';

interface VideoWithLoops {
  videoId: string;
  title: string;
  loops: Loop[];
  thumbnail: string;
}

type TabType = 'loops' | 'library';

@Component({
  selector: 'youtube-loop-sidebar',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class SidebarComponent implements OnInit {
  // Traditional inputs for Angular Elements compatibility
  @Input() set loops(value: Loop[]) { this._loops.set(value); }
  get loops() { return this._loops(); }
  
  @Input() set activeLoopId(value: string | null) { this._activeLoopId.set(value); }
  get activeLoopId() { return this._activeLoopId(); }
  
  @Input() set pitchShift(value: number) { this._pitchShift.set(value); }
  get pitchShift() { return this._pitchShift(); }

  // Internal signals
  private _loops = signal<Loop[]>([]);
  private _activeLoopId = signal<string | null>(null);
  private _pitchShift = signal<number>(0);
  
  // Tab state
  protected activeTab = signal<TabType>('loops');
  protected allVideos = signal<VideoWithLoops[]>([]);
  protected isLoadingVideos = signal<boolean>(false);

  @Output() loopActivated = new EventEmitter<{ loopId: string }>();
  @Output() loopDeactivated = new EventEmitter<void>();
  @Output() loopDeleted = new EventEmitter<{ loopId: string }>();
  @Output() loopUpdated = new EventEmitter<{ loop: Loop }>();
  @Output() getCurrentTime = new EventEmitter<{ callback: (time: number) => void }>();
  @Output() pitchChanged = new EventEmitter<{ semitones: number }>();
  @Output() videoSelected = new EventEmitter<{ videoId: string }>();

  // Internal state
  protected editingLoopId = signal<string | null>(null);
  protected editingLoop: Loop | null = null;
  protected editingName = signal<string>('');
  protected editingStartTime = signal<number>(0);
  protected editingEndTime = signal<number>(0);
  protected editingPauseDuration = signal<number>(0);
  protected editingPlaybackSpeed = signal<number>(1.0);
  protected shareSuccess = signal<boolean>(false);
  
  ngOnInit() {
    // Load video library when component initializes
    this.loadVideoLibrary();
  }
  
  // Switch tabs
  onTabChange(tab: TabType) {
    this.activeTab.set(tab);
    if (tab === 'library') {
      this.loadVideoLibrary();
    }
  }
  
  // Load all videos with loops
  async loadVideoLibrary() {
    this.isLoadingVideos.set(true);
    
    try {
      // Get all video IDs from storage
      const videoIds = await this.getAllVideoIdsFromStorage();
      
      // Load loops for each video
      const videos: VideoWithLoops[] = [];
      for (const videoId of videoIds) {
        const loops = await this.getLoopsFromStorage(videoId);
        if (loops.length > 0) {
          videos.push({
            videoId,
            title: await this.getVideoTitle(videoId),
            loops,
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
          });
        }
      }
      
      this.allVideos.set(videos);
    } catch (error) {
      console.error('Error loading video library:', error);
    } finally {
      this.isLoadingVideos.set(false);
    }
  }
  
  // Navigate to a video
  onVideoClick(videoId: string) {
    window.location.href = `https://www.youtube.com/watch?v=${videoId}`;
  }
  
  // Delete all loops for a video
  async onDeleteVideoLoops(videoId: string, event: MouseEvent) {
    event.stopPropagation();
    
    const video = this.allVideos().find(v => v.videoId === videoId);
    if (!video) return;
    
    if (confirm(`Delete all ${video.loops.length} loops for this video?`)) {
      try {
        await this.deleteLoopsFromStorage(videoId);
        // Reload library
        await this.loadVideoLibrary();
      } catch (error) {
        console.error('Error deleting video loops:', error);
      }
    }
  }
  
  // Helper methods to interact with chrome.storage
  private getAllVideoIdsFromStorage(): Promise<string[]> {
    return new Promise((resolve) => {
      (window as any).chrome.storage.local.get(null, (items: any) => {
        resolve(Object.keys(items));
      });
    });
  }
  
  private getLoopsFromStorage(videoId: string): Promise<Loop[]> {
    return new Promise((resolve) => {
      (window as any).chrome.storage.local.get([videoId], (result: any) => {
        resolve(result[videoId] || []);
      });
    });
  }
  
  private deleteLoopsFromStorage(videoId: string): Promise<void> {
    return new Promise((resolve) => {
      (window as any).chrome.storage.local.remove([videoId], () => {
        resolve();
      });
    });
  }
  
  // Get video title from YouTube API or page
  private async getVideoTitle(videoId: string): Promise<string> {
    try {
      // Try to fetch video info from YouTube's oEmbed API
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (response.ok) {
        const data = await response.json();
        return data.title;
      }
    } catch (error) {
      // Fallback to video ID if fetch fails
    }
    return `Video ${videoId}`;
  }

  // Prevent YouTube keyboard shortcuts when typing in inputs
  onInputKeydown(event: KeyboardEvent) {
    // Stop all event propagation to prevent YouTube from handling the key press
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // Allow Enter and Escape to work for save/cancel
    if (event.key === 'Enter' || event.key === 'Escape') {
      return;
    }
    
    // Prevent default for other keys to stop YouTube shortcuts
    // but allow normal typing behavior
  }

  // Toggle loop activation
  onToggleLoop(loop: Loop) {
    if (this.activeLoopId === loop.id) {
      this.loopDeactivated.emit();
    } else {
      this.loopActivated.emit({ loopId: loop.id });
    }
  }

  // Start editing a loop name
  onEditLoop(loop: Loop, event: MouseEvent) {
    event.stopPropagation();
    this.editingLoopId.set(loop.id);
    this.editingLoop = loop;
    this.editingName.set(loop.name);
    this.editingStartTime.set(loop.startTime);
    this.editingEndTime.set(loop.endTime);
    this.editingPauseDuration.set(loop.pauseDuration || 0);
    this.editingPlaybackSpeed.set(loop.playbackSpeed || 1.0);
  }

  // Save edited loop name and times
  onSaveEdit(loop: Loop) {
    const newName = this.editingName().trim();
    const newStartTime = this.editingStartTime();
    const newEndTime = this.editingEndTime();
    const newPauseDuration = this.editingPauseDuration();
    const newPlaybackSpeed = this.editingPlaybackSpeed();
    
    // Validate times
    if (newStartTime >= newEndTime) {
      alert('Start time must be before end time');
      return;
    }
    
    if (newStartTime < 0 || newEndTime < 0) {
      alert('Times must be positive');
      return;
    }
    
    if (newPauseDuration < 0) {
      alert('Pause duration must be positive');
      return;
    }
    
    if (newPlaybackSpeed < 0.25 || newPlaybackSpeed > 2.0) {
      alert('Playback speed must be between 0.25 and 2.0');
      return;
    }
    
    const hasChanges = newName !== loop.name || 
                      newStartTime !== loop.startTime || 
                      newEndTime !== loop.endTime ||
                      newPauseDuration !== (loop.pauseDuration || 0) ||
                      newPlaybackSpeed !== (loop.playbackSpeed || 1.0);
    
    if (newName && hasChanges) {
      this.loopUpdated.emit({
        loop: { ...loop, name: newName, startTime: newStartTime, endTime: newEndTime, pauseDuration: newPauseDuration, playbackSpeed: newPlaybackSpeed }
      });
    }
    this.editingLoopId.set(null);
  }

  // Cancel editing
  onCancelEdit() {
    this.editingLoopId.set(null);
    this.editingLoop = null;
    this.editingName.set('');
    this.editingStartTime.set(0);
    this.editingEndTime.set(0);
    this.editingPauseDuration.set(0);
    this.editingPlaybackSpeed.set(1.0);
  }

  // Delete a loop
  onDeleteLoop(loop: Loop, event: MouseEvent) {
    event.stopPropagation();
    
    if (confirm(`Delete loop "${loop.name}"?`)) {
      this.loopDeleted.emit({ loopId: loop.id });
    }
  }

  // Check if loop is being edited
  isEditing(loopId: string): boolean {
    return this.editingLoopId() === loopId;
  }

  // Check if loop is active
  isActive(loopId: string): boolean {
    return this.activeLoopId === loopId;
  }

  // Format time as MM:SS.mmm
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const wholeSecs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${mins}:${wholeSecs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  // Get loop duration
  getLoopDuration(loop: Loop): string {
    const duration = loop.endTime - loop.startTime;
    return `${this.formatTime(duration)} long`;
  }

  // Get loop time range
  getLoopTimeRange(loop: Loop): string {
    return `${this.formatTime(loop.startTime)} - ${this.formatTime(loop.endTime)}`;
  }

  // Convert time string (MM:SS.mmm or MM:SS) to seconds
  timeStringToSeconds(timeString: string): number {
    const parts = timeString.split(':');
    if (parts.length !== 2) return 0;
    const mins = parseInt(parts[0], 10) || 0;
    
    // Check if seconds part has milliseconds
    const secondsPart = parts[1];
    if (secondsPart.includes('.')) {
      const [secs, ms] = secondsPart.split('.');
      const seconds = parseInt(secs, 10) || 0;
      const milliseconds = parseInt(ms.padEnd(3, '0').substring(0, 3), 10) || 0;
      return mins * 60 + seconds + milliseconds / 1000;
    } else {
      const secs = parseInt(secondsPart, 10) || 0;
      return mins * 60 + secs;
    }
  }

  // Handle start time input change
  onStartTimeChange(value: string) {
    const seconds = this.timeStringToSeconds(value);
    this.editingStartTime.set(seconds);
  }

  // Handle end time input change
  onEndTimeChange(value: string) {
    const seconds = this.timeStringToSeconds(value);
    this.editingEndTime.set(seconds);
  }

  // Set start time to current video position
  onSetStartToCurrent() {
    this.getCurrentTime.emit({
      callback: (time: number) => {
        // Keep millisecond precision
        const newStartTime = Math.round(time * 1000) / 1000;
        this.editingStartTime.set(newStartTime);
        
        // Emit immediate update to refresh timeline with all current editing values
        if (this.editingLoop) {
          this.loopUpdated.emit({
            loop: { 
              ...this.editingLoop, 
              name: this.editingName(),
              startTime: newStartTime,
              endTime: this.editingEndTime(),
              pauseDuration: this.editingPauseDuration(),
              playbackSpeed: this.editingPlaybackSpeed()
            }
          });
        }
      }
    });
  }

  // Set end time to current video position
  onSetEndToCurrent() {
    this.getCurrentTime.emit({
      callback: (time: number) => {
        // Keep millisecond precision
        const newEndTime = Math.round(time * 1000) / 1000;
        this.editingEndTime.set(newEndTime);
        
        // Emit immediate update to refresh timeline with all current editing values
        if (this.editingLoop) {
          this.loopUpdated.emit({
            loop: { 
              ...this.editingLoop, 
              name: this.editingName(),
              startTime: this.editingStartTime(),
              endTime: newEndTime,
              pauseDuration: this.editingPauseDuration(),
              playbackSpeed: this.editingPlaybackSpeed()
            }
          });
        }
      }
    });
  }

  // Share loops via URL
  onShareLoops() {
    if (this.loops.length === 0) return;

    // Create compact loop data (only essential fields)
    const loopsData = this.loops.map(loop => ({
      n: loop.name,
      s: loop.startTime,
      e: loop.endTime,
      c: loop.color,
      ...(loop.pauseDuration && { p: loop.pauseDuration }),
      ...(loop.playbackSpeed && loop.playbackSpeed !== 1.0 && { r: loop.playbackSpeed })
    }));

    // Encode to base64 URL-safe format
    const jsonStr = JSON.stringify(loopsData);
    const base64 = btoa(jsonStr)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Get current URL and add hash
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = `loops=${base64}`;

    // Copy to clipboard
    navigator.clipboard.writeText(currentUrl.toString()).then(() => {
      this.shareSuccess.set(true);
      setTimeout(() => this.shareSuccess.set(false), 2000);
    });
  }

  // Pitch control methods
  onPitchUp() {
    const newPitch = this._pitchShift() + 1;
    this._pitchShift.set(newPitch);
    this.pitchChanged.emit({ semitones: newPitch });
  }

  onPitchDown() {
    const newPitch = this._pitchShift() - 1;
    this._pitchShift.set(newPitch);
    this.pitchChanged.emit({ semitones: newPitch });
  }

  onPitchReset() {
    this._pitchShift.set(0);
    this.pitchChanged.emit({ semitones: 0 });
  }
}
